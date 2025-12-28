
import { useState, useRef } from 'react';
import { Command, Child } from '@tauri-apps/plugin-shell';

interface ProjectRunnerProps {
    projectPath: string;
    onUrlReady: (url: string) => void;
}

export default function ProjectRunner({ projectPath, onUrlReady }: ProjectRunnerProps) {
    const [status, setStatus] = useState<'idle' | 'running' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [pid, setPid] = useState<number | null>(null);
    const childRef = useRef<Child | null>(null);

    const stripAnsi = (str: string) => {
        // eslint-disable-next-line no-control-regex
        return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    };

    const extractUrl = (text: string) => {
        const cleanText = stripAnsi(text);
        const match = cleanText.match(/http:\/\/localhost:\d+(\/[^\s]*)?/);
        if (match) {
            onUrlReady(match[0]);
        }
    };

    const startDevServer = async () => {
        if (status === 'running') return;

        setStatus('running');
        setLogs(prev => [...prev, "Starting dev server..."]);

        try {
            const cmd = Command.create('npm-start', ['run', 'dev'], { cwd: projectPath });

            cmd.on('close', (data: any) => {
                setStatus('idle');
                setLogs(prev => [...prev, `Process finished with code ${data.code}`]);
                setPid(null);
                childRef.current = null;
            });

            cmd.on('error', (error: any) => {
                setStatus('error');
                setLogs(prev => [...prev, `Error: ${error}`]);
            });

            cmd.stdout.on('data', (line: string) => {
                setLogs(prev => [...prev, line]);
                extractUrl(line);
            });

            cmd.stderr.on('data', (line: string) => {
                setLogs(prev => [...prev, line]);
                extractUrl(line);
            });

            const child = await cmd.spawn();
            childRef.current = child;
            setPid(child.pid);
            setLogs(prev => [...prev, `Process started. PID: ${child.pid}`]);

        } catch (err) {
            console.error(err);
            setStatus('error');
            setLogs(prev => [...prev, `Failed to spawn: ${err}`]);
        }
    };

    const stopServer = async () => {
        if (childRef.current) {
            setLogs(prev => [...prev, "Stopping server..."]);
            try {
                await childRef.current.kill();
            } catch (e) {
                setLogs(prev => [...prev, `Error killing process: ${e}`]);
            }
        }
    };

    return (
        <div style={{ padding: 10, background: '#222', color: '#ccc', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                {status === 'idle' ? (
                    <button onClick={startDevServer} style={{ background: '#2ea44f', color: 'white', border: 'none', padding: '5px 15px', borderRadius: 4 }}>
                        Start Dev Server
                    </button>
                ) : (
                    <>
                        <button disabled style={{ background: '#555', color: 'white', border: 'none', padding: '5px 15px', borderRadius: 4 }}>
                            Running (PID: {pid})
                        </button>
                        <button onClick={stopServer} style={{ background: '#d73a49', color: 'white', border: 'none', padding: '5px 15px', borderRadius: 4 }}>
                            Stop Server
                        </button>
                    </>
                )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', background: '#000', padding: 10, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
                {logs.join('\n')}
            </div>
        </div>
    );
}
