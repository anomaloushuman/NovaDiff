import type { StructuralAnalysis, CallGraphEntry } from "../../types.js";
import type { LanguageExtractor, TreeSitterNode } from "./types.js";
import { traverse, findChild } from "./base-extractor.js";

const FUNCTION_NODE_TYPES = new Set([
  "function_definition",
  "function_declaration",
  "function_item",
  "method_definition",
  "method_declaration",
  "constructor_declaration",
  "accessor_declaration",
  "arrow_function",
  "function_expression",
  "generator_function_declaration",
  "lambda_expression",
]);

const CLASS_NODE_TYPES = new Set([
  "class_definition",
  "class_declaration",
  "class_specifier",
  "struct_specifier",
  "struct_item",
  "interface_declaration",
  "enum_declaration",
  "enum_specifier",
  "trait_item",
  "impl_item",
  "object_declaration",
  "companion_object",
  "protocol_declaration",
  "extension_declaration",
  "type_alias_declaration",
]);

const IMPORT_NODE_TYPES = new Set([
  "import_statement",
  "import_declaration",
  "use_declaration",
  "preproc_include",
  "include_directive",
]);

const EXPORT_NODE_TYPES = new Set([
  "export_statement",
  "export_declaration",
  "export_all_declaration",
]);

function nodeName(node: TreeSitterNode): string | null {
  const byField =
    node.childForFieldName("name") ??
    node.childForFieldName("declarator") ??
    findChild(node, "identifier") ??
    findChild(node, "type_identifier") ??
    findChild(node, "property_identifier");
  if (byField) {
    const text = byField.text.trim();
    if (text) {
      return text;
    }
  }
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (!child) {
      continue;
    }
    if (
      child.type === "identifier" ||
      child.type === "type_identifier" ||
      child.type === "property_identifier"
    ) {
      const text = child.text.trim();
      if (text && !["func", "fn", "def", "class", "struct", "enum", "interface"].includes(text)) {
        return text;
      }
    }
  }
  return null;
}

function lineRange(node: TreeSitterNode): [number, number] {
  const start = node.startPosition.row + 1;
  const end = node.endPosition.row + 1;
  return [start, Math.max(start, end)];
}

function importSource(node: TreeSitterNode): string | null {
  const pathNode =
    node.childForFieldName("path") ??
    node.childForFieldName("source") ??
    node.childForFieldName("module_name");
  if (pathNode) {
    return pathNode.text.replace(/^['"]|['"]$/g, "").trim();
  }
  const str = node.text.trim();
  if (str.length > 0 && str.length < 512) {
    return str;
  }
  return null;
}

/**
 * Best-effort structural extraction for any tree-sitter grammar without a
 * language-specific extractor.
 */
export class GenericExtractor implements LanguageExtractor {
  readonly languageIds: string[] = ["*"];

  extractStructure(rootNode: TreeSitterNode): StructuralAnalysis {
    const functions: StructuralAnalysis["functions"] = [];
    const classes: StructuralAnalysis["classes"] = [];
    const imports: StructuralAnalysis["imports"] = [];
    const exports: StructuralAnalysis["exports"] = [];
    const seenFunctions = new Set<string>();
    const seenClasses = new Set<string>();

    traverse(rootNode, (node) => {
      if (FUNCTION_NODE_TYPES.has(node.type)) {
        const name = nodeName(node);
        if (name && !seenFunctions.has(name)) {
          seenFunctions.add(name);
          functions.push({
            name,
            lineRange: lineRange(node),
            params: [],
          });
        }
      }
      if (CLASS_NODE_TYPES.has(node.type)) {
        const name = nodeName(node);
        if (name && !seenClasses.has(name)) {
          seenClasses.add(name);
          classes.push({
            name,
            lineRange: lineRange(node),
            methods: [],
            properties: [],
          });
        }
      }
      if (IMPORT_NODE_TYPES.has(node.type)) {
        const source = importSource(node);
        if (source) {
          imports.push({ source, specifiers: [], lineNumber: lineRange(node)[0] });
        }
      }
      if (EXPORT_NODE_TYPES.has(node.type)) {
        const name = nodeName(node);
        exports.push({
          name: name ?? "default",
          lineNumber: lineRange(node)[0],
          isDefault: !name,
        });
      }
    });

    return { functions, classes, imports, exports };
  }

  extractCallGraph(_rootNode: TreeSitterNode): CallGraphEntry[] {
    return [];
  }
}

export const genericExtractor = new GenericExtractor();
