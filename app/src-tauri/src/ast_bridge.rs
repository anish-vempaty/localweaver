use oxc_allocator::Allocator;
use oxc_ast::ast::{
    self, Argument, Expression, JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXChild,
    JSXElementName, JSXExpression, JSXExpressionContainer, JSXIdentifier, ObjectPropertyKind,
    PropertyKey, StringLiteral,
};
use oxc_codegen::{Codegen, CodegenOptions};
use oxc_parser::Parser;
use oxc_span::{SourceType, Span};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ComponentNode {
    pub id: String,
    pub name: String,
    pub props: serde_json::Map<String, serde_json::Value>,
    pub children: Vec<ComponentNode>,
    pub text_content: Option<String>,
    pub start: u32,
    pub end: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateRequest {
    pub node_id: String,
    pub new_props: Option<serde_json::Map<String, serde_json::Value>>,
}

pub fn parse_jsx(content: &str) -> Result<Vec<ComponentNode>, String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path("file.tsx")
        .unwrap()
        .with_typescript(true)
        .with_jsx(true);

    let ret = Parser::new(&allocator, content, source_type).parse();

    if !ret.errors.is_empty() {
        return Err(format!("Parse errors: {:?}", ret.errors));
    }

    let program = ret.program;
    let mut nodes = Vec::new();

    for stmt in &program.body {
        if let ast::Statement::ExportDefaultDeclaration(export) = stmt {
            if let ast::ExportDefaultDeclarationKind::FunctionDeclaration(func) =
                &export.declaration
            {
                if let Some(body) = &func.body {
                    for statement in &body.statements {
                        if let ast::Statement::ReturnStatement(ret_stmt) = statement {
                            if let Some(arg) = &ret_stmt.argument {
                                if let Some(node) = expr_to_node(arg, content) {
                                    nodes.push(node);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(nodes)
}

fn expr_to_node(expr: &Expression, source: &str) -> Option<ComponentNode> {
    match expr {
        Expression::JSXElement(el) => Some(jsx_element_to_node(el, source)),
        Expression::JSXFragment(frag) => {
            let children = frag
                .children
                .iter()
                .filter_map(|c| jsx_child_to_node(c, source))
                .collect();
            Some(ComponentNode {
                id: format!("{}-{}", frag.span.start, frag.span.end),
                name: "Fragment".to_string(),
                props: serde_json::Map::new(),
                children,
                text_content: None,
                start: frag.span.start,
                end: frag.span.end,
            })
        }
        Expression::ParenthesizedExpression(paren) => expr_to_node(&paren.expression, source),
        _ => None,
    }
}

fn jsx_element_to_node(el: &ast::JSXElement, source: &str) -> ComponentNode {
    let name = get_jsx_name(&el.opening_element.name);
    let mut props = serde_json::Map::new();

    for attr in &el.opening_element.attributes {
        match attr {
            JSXAttributeItem::Attribute(a) => {
                let key = get_jsx_attr_name(&a.name);
                let val = match &a.value {
                    Some(JSXAttributeValue::StringLiteral(s)) => {
                        serde_json::Value::String(s.value.to_string())
                    }
                    None => serde_json::Value::Bool(true),
                    Some(JSXAttributeValue::ExpressionContainer(exp)) => {
                        let content = match &exp.expression {
                            JSXExpression::StringLiteral(s) => s.value.to_string(),
                            JSXExpression::TemplateLiteral(t) => t
                                .quasis
                                .iter()
                                .map(|q| q.value.raw.to_string())
                                .collect::<Vec<_>>()
                                .join(""),
                            _ => {
                                let span = exp.span;
                                if (span.end as usize) <= source.len() {
                                    source[span.start as usize..span.end as usize].to_string()
                                } else {
                                    "{...}".to_string()
                                }
                            }
                        };
                        serde_json::Value::String(content)
                    }
                    _ => serde_json::Value::String("{...}".to_string()),
                };
                props.insert(key, val);
            }
            _ => {}
        }
    }

    let children = el
        .children
        .iter()
        .filter_map(|c| jsx_child_to_node(c, source))
        .collect();

    ComponentNode {
        id: format!("{}-{}", el.span.start, el.span.end),
        name,
        props,
        children,
        text_content: None,
        start: el.span.start,
        end: el.span.end,
    }
}

fn jsx_child_to_node(child: &JSXChild, source: &str) -> Option<ComponentNode> {
    match child {
        JSXChild::Element(el) => Some(jsx_element_to_node(el, source)),
        JSXChild::Fragment(frag) => {
            let children = frag
                .children
                .iter()
                .filter_map(|c| jsx_child_to_node(c, source))
                .collect();
            Some(ComponentNode {
                id: format!("{}-{}", frag.span.start, frag.span.end),
                name: "Fragment".to_string(),
                props: serde_json::Map::new(),
                children,
                text_content: None,
                start: frag.span.start,
                end: frag.span.end,
            })
        }
        JSXChild::Text(text) => {
            let t = text.value.trim();
            if t.is_empty() {
                return None;
            }
            Some(ComponentNode {
                id: format!("{}-{}", text.span.start, text.span.end),
                name: "#text".to_string(),
                props: serde_json::Map::new(),
                children: vec![],
                text_content: Some(t.to_string()),
                start: text.span.start,
                end: text.span.end,
            })
        }
        JSXChild::ExpressionContainer(exp) => {
            let content = match &exp.expression {
                JSXExpression::StringLiteral(s) => s.value.to_string(),
                JSXExpression::TemplateLiteral(t) => t
                    .quasis
                    .iter()
                    .map(|q| q.value.raw.to_string())
                    .collect::<Vec<_>>()
                    .join(""),
                _ => {
                    let span = exp.span;
                    if (span.end as usize) <= source.len() {
                        source[span.start as usize..span.end as usize].to_string()
                    } else {
                        "{...}".to_string()
                    }
                }
            };

            Some(ComponentNode {
                id: format!("{}-{}", exp.span.start, exp.span.end),
                name: "#expression".to_string(),
                props: serde_json::Map::new(),
                children: vec![],
                text_content: Some(content),
                start: exp.span.start,
                end: exp.span.end,
            })
        }
        _ => None,
    }
}

fn get_jsx_name(name: &JSXElementName) -> String {
    match name {
        JSXElementName::Identifier(id) => id.name.to_string(),
        JSXElementName::IdentifierReference(id) => id.name.to_string(),
        JSXElementName::MemberExpression(mem) => {
            format!("{}.{}", get_jsx_obj_name(&mem.object), mem.property.name)
        }
        JSXElementName::NamespacedName(ns) => format!("{}:{}", ns.namespace.name, ns.name.name),
        JSXElementName::ThisExpression(_) => "this".to_string(),
    }
}

fn get_jsx_obj_name(obj: &ast::JSXMemberExpressionObject) -> String {
    match obj {
        ast::JSXMemberExpressionObject::IdentifierReference(id) => id.name.to_string(),
        ast::JSXMemberExpressionObject::MemberExpression(mem) => {
            format!("{}.{}", get_jsx_obj_name(&mem.object), mem.property.name)
        }
        ast::JSXMemberExpressionObject::ThisExpression(_) => "this".to_string(),
    }
}

fn get_jsx_attr_name(name: &JSXAttributeName) -> String {
    match name {
        JSXAttributeName::Identifier(id) => id.name.to_string(),
        JSXAttributeName::NamespacedName(ns) => format!("{}:{}", ns.namespace.name, ns.name.name),
    }
}

pub fn update_jsx_node(content: &str, updates: Vec<UpdateRequest>) -> Result<String, String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path("file.tsx")
        .unwrap()
        .with_typescript(true)
        .with_jsx(true);

    let ret = Parser::new(&allocator, content, source_type).parse();

    if !ret.errors.is_empty() {
        return Err("Parse failed".to_string());
    }

    let mut program = ret.program;

    for update in updates {
        visit_program_mut(&mut program, &update, &allocator);
    }

    let codegen = Codegen::new().with_options(CodegenOptions::default());
    let printed = codegen.build(&program);

    Ok(printed.code)
}

fn visit_program_mut<'a>(
    program: &mut ast::Program<'a>,
    update: &UpdateRequest,
    allocator: &'a Allocator,
) {
    for stmt in &mut program.body {
        if let ast::Statement::ExportDefaultDeclaration(export) = stmt {
            if let ast::ExportDefaultDeclarationKind::FunctionDeclaration(func) =
                &mut export.declaration
            {
                if let Some(body) = &mut func.body {
                    for statement in &mut body.statements {
                        if let ast::Statement::ReturnStatement(ret_stmt) = statement {
                            if let Some(arg) = &mut ret_stmt.argument {
                                visit_expr_mut(arg, update, allocator);
                            }
                        }
                    }
                }
            }
        }
    }
}

fn visit_expr_mut<'a>(expr: &mut Expression<'a>, update: &UpdateRequest, allocator: &'a Allocator) {
    match expr {
        Expression::JSXElement(el) => visit_jsx_element_mut(el, update, allocator),
        Expression::JSXFragment(frag) => {
            for child in &mut frag.children {
                visit_jsx_child_mut(child, update, allocator);
            }
        }
        Expression::ParenthesizedExpression(paren) => {
            visit_expr_mut(&mut paren.expression, update, allocator)
        }
        _ => {}
    }
}

fn visit_jsx_child_mut<'a>(
    child: &mut JSXChild<'a>,
    update: &UpdateRequest,
    allocator: &'a Allocator,
) {
    match child {
        JSXChild::Element(el) => visit_jsx_element_mut(el, update, allocator),
        JSXChild::Fragment(frag) => {
            for c in &mut frag.children {
                visit_jsx_child_mut(c, update, allocator);
            }
        }
        _ => {}
    }
}

fn visit_jsx_element_mut<'a>(
    el: &mut ast::JSXElement<'a>,
    update: &UpdateRequest,
    allocator: &'a Allocator,
) {
    let id = format!("{}-{}", el.span.start, el.span.end);

    if id == update.node_id {
        if let Some(new_props) = &update.new_props {
            for (key, val) in new_props {
                let mut found = false;
                // Update existing
                for attr in &mut el.opening_element.attributes {
                    if let JSXAttributeItem::Attribute(a) = attr {
                        if get_jsx_attr_name(&a.name) == *key {
                            found = true;
                            if let serde_json::Value::String(s) = val {
                                // Allocate string in arena
                                let s_alloc = allocator.alloc_str(s);
                                a.value = Some(JSXAttributeValue::StringLiteral(
                                    oxc_allocator::Box::new_in(
                                        StringLiteral {
                                            span: Span::default(),
                                            value: oxc_ast::ast::Atom::from(s_alloc),
                                            raw: None,
                                            lone_surrogates: false,
                                        },
                                        allocator,
                                    ),
                                ));
                            }
                        }
                    }
                }

                // Add new
                if !found {
                    if let serde_json::Value::String(s) = val {
                        let k_alloc = allocator.alloc_str(key);
                        let s_alloc = allocator.alloc_str(s);

                        let attr_name = JSXAttributeName::Identifier(oxc_allocator::Box::new_in(
                            JSXIdentifier {
                                span: Span::default(),
                                name: oxc_ast::ast::Atom::from(k_alloc),
                            },
                            allocator,
                        ));

                        let attr_val =
                            JSXAttributeValue::StringLiteral(oxc_allocator::Box::new_in(
                                StringLiteral {
                                    span: Span::default(),
                                    value: oxc_ast::ast::Atom::from(s_alloc),
                                    raw: None,
                                    lone_surrogates: false,
                                },
                                allocator,
                            ));

                        let new_attr = JSXAttributeItem::Attribute(oxc_allocator::Box::new_in(
                            oxc_ast::ast::JSXAttribute {
                                span: Span::default(),
                                name: attr_name,
                                value: Some(attr_val),
                            },
                            allocator,
                        ));

                        el.opening_element.attributes.push(new_attr);
                    }
                }
            }
        }
    }

    // Children
    for child in &mut el.children {
        visit_jsx_child_mut(child, update, allocator);
    }
}
