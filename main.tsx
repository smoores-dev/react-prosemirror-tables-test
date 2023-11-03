import "prosemirror-view/style/prosemirror.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-gapcursor/style/gapcursor.css";
import "prosemirror-tables/style/tables.css";

import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { EditorState } from "prosemirror-state";
import { DOMParser, Schema } from "prosemirror-model";
import { schema as baseSchema } from "prosemirror-schema-basic";
import { keymap } from "prosemirror-keymap";
import { exampleSetup, buildMenuItems } from "prosemirror-example-setup";
import { MenuItem, Dropdown } from "prosemirror-menu";

import {
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  addRowAfter,
  addRowBefore,
  deleteRow,
  mergeCells,
  splitCell,
  setCellAttr,
  toggleHeaderRow,
  toggleHeaderColumn,
  toggleHeaderCell,
  goToNextCell,
  deleteTable,
  tableEditing,
  columnResizing,
  tableNodes,
  fixTables,
} from "prosemirror-tables";
import { ProseMirror } from "@nytimes/react-prosemirror";

const schema = new Schema({
  nodes: baseSchema.spec.nodes.append(
    tableNodes({
      tableGroup: "block",
      cellContent: "block+",
      cellAttributes: {
        background: {
          default: null,
          getFromDOM(dom) {
            return dom.style.backgroundColor || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || "") + `background-color: ${value};`;
          },
        },
      },
    })
  ),
  marks: baseSchema.spec.marks,
});

const menu = buildMenuItems(schema).fullMenu;
function item(label: string, cmd: (state: EditorState) => boolean) {
  return new MenuItem({ label, select: cmd, run: cmd });
}
const tableMenu = [
  item("Insert column before", addColumnBefore),
  item("Insert column after", addColumnAfter),
  item("Delete column", deleteColumn),
  item("Insert row before", addRowBefore),
  item("Insert row after", addRowAfter),
  item("Delete row", deleteRow),
  item("Delete table", deleteTable),
  item("Merge cells", mergeCells),
  item("Split cell", splitCell),
  item("Toggle header column", toggleHeaderColumn),
  item("Toggle header row", toggleHeaderRow),
  item("Toggle header cells", toggleHeaderCell),
  item("Make cell green", setCellAttr("background", "#dfd")),
  item("Make cell not-green", setCellAttr("background", null)),
];
menu.splice(2, 0, [new Dropdown(tableMenu, { label: "Table" })]);

const contentElement = document.querySelector("#content");
if (!contentElement) {
  throw new Error("Failed to find #content");
}
const doc = DOMParser.fromSchema(schema).parse(contentElement);

let initialState = EditorState.create({
  doc,
  plugins: [
    columnResizing(),
    tableEditing(),
    keymap({
      Tab: goToNextCell(1),
      "Shift-Tab": goToNextCell(-1),
    }),
  ].concat(
    exampleSetup({
      schema,
      // @ts-expect-error: prosemirror-example-setup exports wrong types here.
      menuContent: menu,
    })
  ),
});
const fix = fixTables(initialState);
if (fix) initialState = initialState.apply(fix.setMeta("addToHistory", false));

function TableEditor() {
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const [state, setState] = useState<EditorState>(initialState);

  return (
    <ProseMirror
      mount={mount}
      state={state}
      dispatchTransaction={function (tr) {
        setState((prev) => prev.apply(tr));
      }}
    >
      <div ref={setMount}></div>
    </ProseMirror>
  );
}

document.execCommand("enableObjectResizing", false, "false");
document.execCommand("enableInlineTableEditing", false, "false");

const root = createRoot(document.getElementById("root")!);
root.render(<TableEditor />);
