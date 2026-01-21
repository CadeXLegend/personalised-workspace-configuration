use std::borrow::Cow;
use std::collections::BTreeMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StringFormatterError {
    Custom(String),
    Parse(String),
}

impl fmt::Display for StringFormatterError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Custom(error) => write!(f, "{error}"),
            Self::Parse(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for StringFormatterError {}

impl From<String> for StringFormatterError {
    fn from(error: String) -> Self {
        Self::Custom(error)
    }
}

#[derive(Clone, Debug)]
pub enum FormatElement<'a> {
    Text(Cow<'a, str>),
    TextGroup {
        style: Vec<StyleElement>,
        elements: Vec<FormatElement<'a>>,
    },
    Variable(Cow<'a, str>),
    Conditional(Vec<FormatElement<'a>>),
}

#[derive(Clone, Debug)]
pub enum StyleElement {
    Text(()),
    Variable(String),
}

type VariableMapType<'a> = BTreeMap<String, Option<Result<Cow<'a, str>, StringFormatterError>>>;
type StyleVariableMapType<'a> =
    BTreeMap<String, Option<Result<Cow<'a, str>, StringFormatterError>>>;

pub struct StringFormatter<'a> {
    elements: Vec<FormatElement<'a>>,
    variables: VariableMapType<'a>,
    style_variables: StyleVariableMapType<'a>,
}

impl<'a> StringFormatter<'a> {
    pub fn new(format: &'a str) -> Result<Self, StringFormatterError> {
        let elements = parse_format_string(format)?;

        let variables = elements
            .iter()
            .filter_map(|el| el.get_variables())
            .map(|v| (v.to_string(), None))
            .collect();

        let style_variables = elements
            .iter()
            .filter_map(|el| el.get_style_variables())
            .map(|v| (v.to_string(), None))
            .collect();

        Ok(Self {
            elements,
            variables,
            style_variables,
        })
    }

    pub fn raw(text: &'a str) -> Self {
        Self {
            elements: vec![FormatElement::Text(text.into())],
            variables: BTreeMap::new(),
            style_variables: BTreeMap::new(),
        }
    }

    #[must_use]
    pub fn map_with<F>(mut self, mapper: F) -> Self
    where
        F: Fn(&str) -> Option<Result<Cow<'a, str>, StringFormatterError>>,
    {
        for (key, value) in self
            .variables
            .iter_mut()
            .filter(|(_, value)| value.is_none())
        {
            if let Some(result) = mapper(key) {
                *value = Some(result);
            }
        }
        self
    }

    #[must_use]
    pub fn map_style<T, M>(mut self, mapper: M) -> Self
    where
        T: Into<Cow<'a, str>>,
        M: Fn(&str) -> Option<Result<T, StringFormatterError>>,
    {
        for (key, value) in self
            .style_variables
            .iter_mut()
            .filter(|(_, value)| value.is_none())
        {
            if let Some(result) = mapper(key) {
                *value = Some(result.map(Into::into));
            }
        }
        self
    }

    pub fn parse(&self) -> Result<String, StringFormatterError> {
        let mut result = String::new();
        self.parse_element(
            &self.elements,
            &self.variables,
            &self.style_variables,
            &mut result,
        )?;
        Ok(result)
    }

    fn parse_element(
        &self,
        elements: &[FormatElement<'a>],
        variables: &VariableMapType<'a>,
        _style_variables: &StyleVariableMapType<'a>,
        output: &mut String,
    ) -> Result<(), StringFormatterError> {
        for el in elements {
            match el {
                FormatElement::Text(text) => {
                    output.push_str(text.as_ref());
                }
                FormatElement::Variable(name) => {
                    if let Some(Some(Ok(value))) = variables.get(name.as_ref()) {
                        output.push_str(value.as_ref());
                    }
                }
                FormatElement::TextGroup { elements, .. } => {
                    self.parse_element(elements, variables, _style_variables, output)?;
                }
                FormatElement::Conditional(elements) => {
                    let variables_in_conditional: Vec<&str> = elements
                        .iter()
                        .filter_map(|el| el.get_variables())
                        .collect();

                    let all_have_values = variables_in_conditional
                        .iter()
                        .all(|var| variables.get(*var).map(|v| v.is_some()).unwrap_or(false));

                    if all_have_values {
                        self.parse_element(elements, variables, _style_variables, output)?;
                    }
                }
            }
        }
        Ok(())
    }
}

impl FormatElement<'_> {
    fn get_variables(&self) -> Option<&str> {
        match self {
            FormatElement::Variable(name) => Some(name.as_ref()),
            FormatElement::Text(_) => None,
            FormatElement::TextGroup { elements, .. } => {
                elements.iter().find_map(|el| el.get_variables())
            }
            FormatElement::Conditional(elements) => {
                elements.iter().find_map(|el| el.get_variables())
            }
        }
    }

    fn get_style_variables(&self) -> Option<&str> {
        match self {
            FormatElement::TextGroup { style, .. } => style.iter().find_map(|el| match el {
                StyleElement::Variable(name) => Some(name.as_ref()),
                StyleElement::Text(_) => None,
            }),
            _ => None,
        }
    }
}

fn parse_format_string(input: &str) -> Result<Vec<FormatElement<'_>>, StringFormatterError> {
    let mut elements = Vec::new();
    let mut current_text = String::new();
    let mut i = 0;

    while i < input.len() {
        let chars: Vec<char> = input.chars().collect();

        if chars[i] == '@' && i + 1 < input.len() && chars[i + 1] == '(' {
            if !current_text.is_empty() {
                elements.push(FormatElement::Text(current_text.into()));
                current_text = String::new();
            }

            let mut depth = 1;
            let start = i + 2;
            let mut end = start;

            while end < chars.len() && depth > 0 {
                if chars[end] == '(' {
                    depth += 1;
                } else if chars[end] == ')' {
                    depth -= 1;
                }
                end += 1;
            }

            if depth != 0 {
                return Err(StringFormatterError::Parse(
                    "Unbalanced parentheses in conditional".to_string(),
                ));
            }

            let conditional_content = &input[start..end - 1];
            let conditional_elements = parse_format_string(conditional_content)?;
            elements.push(FormatElement::Conditional(conditional_elements));
            i = end;
            continue;
        }

        if chars[i] == '[' {
            let close_bracket = input[i + 1..].find(']');
            if let Some(close_idx) = close_bracket {
                let content = &input[i + 1..i + 1 + close_idx];
                let after_bracket = i + 1 + close_idx + 1;

                if after_bracket < input.len() && chars[after_bracket] == '(' {
                    let close_paren = input[after_bracket + 1..].find(')');
                    if let Some(paren_idx) = close_paren {
                        let style_str = &input[after_bracket + 1..after_bracket + 1 + paren_idx];

                        let style_elements = parse_style_string(style_str);

                        let inner_elements = parse_format_string(content)?;

                        elements.push(FormatElement::TextGroup {
                            style: style_elements,
                            elements: inner_elements,
                        });

                        i = after_bracket + 1 + paren_idx + 1;
                        continue;
                    }
                }
            }
        }

        if chars[i] == '$' {
            if !current_text.is_empty() {
                elements.push(FormatElement::Text(current_text.into()));
                current_text = String::new();
            }

            let mut var_name = String::new();
            let mut j = i + 1;
            while j < chars.len() {
                let c = chars[j];
                if c.is_alphanumeric() || c == '_' || c == ':' {
                    var_name.push(c);
                    j += 1;
                } else {
                    break;
                }
            }

            if !var_name.is_empty() {
                elements.push(FormatElement::Variable(var_name.into()));
                i = j;
                continue;
            }
        }

        current_text.push(chars[i]);
        i += 1;
    }

    if !current_text.is_empty() {
        elements.push(FormatElement::Text(current_text.into()));
    }

    Ok(elements)
}

fn parse_style_string(style_str: &str) -> Vec<StyleElement> {
    let mut elements = Vec::new();
    let mut current_text = String::new();
    let mut i = 0;

    while i < style_str.len() {
        let chars: Vec<char> = style_str.chars().collect();

        if chars[i] == '$' {
            if !current_text.is_empty() {
                elements.push(StyleElement::Text(()));
                current_text = String::new();
            }

            let mut var_name = String::new();
            let mut j = i + 1;
            while j < chars.len() {
                let c = chars[j];
                if c.is_alphanumeric() || c == '_' {
                    var_name.push(c);
                    j += 1;
                } else {
                    break;
                }
            }

            if !var_name.is_empty() {
                elements.push(StyleElement::Variable(var_name));
                i = j;
                continue;
            }
        }

        current_text.push(chars[i]);
        i += 1;
    }

    if !current_text.is_empty() {
        elements.push(StyleElement::Text(()));
    }

    elements
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plain_text() {
        let formatter = StringFormatter::new("hello world").unwrap();
        assert_eq!(formatter.parse().unwrap(), "hello world");
    }

    #[test]
    fn test_variable() {
        let formatter = StringFormatter::new("hello $name")
            .unwrap()
            .map_with(|var| Some(Ok(Cow::Owned(var.to_string()))));
        assert_eq!(formatter.parse().unwrap(), "hello name");
    }

    #[test]
    fn test_text_group() {
        let formatter = StringFormatter::new("[hello](bold)").unwrap();
        assert_eq!(formatter.parse().unwrap(), "hello");
    }

    #[test]
    fn test_conditional_with_value() {
        let formatter = StringFormatter::new(r"@($visible)")
            .unwrap()
            .map_with(|_var| Some(Ok("shown".into())));
        assert_eq!(formatter.parse().unwrap(), "shown");
    }

    #[test]
    fn test_conditional_without_value() {
        let formatter = StringFormatter::new(r"@($hidden)").unwrap();
        assert_eq!(formatter.parse().unwrap(), "");
    }

    #[test]
    fn test_mixed() {
        let formatter = StringFormatter::new(r"[usage](bold) $cmd [options](underline)")
            .unwrap()
            .map_with(|var| match var {
                "cmd" => Some(Ok("stardust ".into())),
                _ => None,
            });
        assert_eq!(formatter.parse().unwrap(), "usage stardust options ");
    }
}
