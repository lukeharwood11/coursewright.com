import assert from "node:assert/strict";
import test from "node:test";
import React, { act, createElement, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MaterialRecord } from "@/materials/databridge/materials";
import type { LessonPlanResourcePickerNode } from "@/lesson-plans/model/dayResources";
import { LinkContentModal } from "./LinkContentModal.tsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

class NodeBase {}
class ElementBase extends NodeBase {}
class HTMLElementBase extends ElementBase {}
class HTMLIFrameElementBase extends HTMLElementBase {}

type FakeNode = {
  nodeType: number;
  tagName?: string;
  nodeName: string;
  childNodes: FakeNode[];
  children: FakeNode[];
  style: Record<string, string>;
  attributes: Record<string, string>;
  parentNode: FakeNode | null;
  ownerDocument: FakeDocument | null;
  namespaceURI?: string;
  textContent: string;
  nodeValue?: string;
  className?: string;
  value?: string;
  checked?: boolean;
  _listeners: Record<string, Array<(event: FakeEvent) => void>>;
  setAttribute: (name: string, value: string) => void;
  getAttribute: (name: string) => string | null;
  removeAttribute: (name: string) => void;
  hasAttribute: (name: string) => boolean;
  appendChild: (child: FakeNode) => FakeNode;
  removeChild: (child: FakeNode) => FakeNode;
  insertBefore: (child: FakeNode, ref: FakeNode | null) => FakeNode;
  addEventListener: (type: string, fn: (event: FakeEvent) => void) => void;
  removeEventListener: (type: string, fn: (event: FakeEvent) => void) => void;
  focus: () => void;
  blur: () => void;
  contains: (other: FakeNode) => boolean;
};

type FakeEvent = {
  type: string;
  target: FakeNode;
  currentTarget: FakeNode | null;
  bubbles: boolean;
  cancelable: boolean;
  defaultPrevented: boolean;
  eventPhase: number;
  timeStamp: number;
  button: number;
  buttons: number;
  detail: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  relatedTarget: null;
  key?: string;
  nativeEvent: FakeEvent;
  _stop?: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
  isPropagationStopped: () => boolean;
};

type FakeDocument = FakeNode & {
  body: FakeNode;
  documentElement: FakeNode;
  activeElement: FakeNode | null;
  HTMLIFrameElement: typeof HTMLIFrameElementBase;
  createElement: (tag: string) => FakeNode;
  createElementNS: (ns: string, tag: string) => FakeNode;
  createTextNode: (text: string) => FakeNode;
};

function createElementNode(tag: string, owner: FakeDocument): FakeNode {
  let text = "";
  const node = {
    nodeType: 1,
    tagName: String(tag).toUpperCase(),
    nodeName: String(tag).toUpperCase(),
    childNodes: [] as FakeNode[],
    children: [] as FakeNode[],
    style: {},
    attributes: {} as Record<string, string>,
    parentNode: null,
    ownerDocument: owner,
    namespaceURI: "http://www.w3.org/1999/xhtml",
    className: "",
    value: "",
    checked: false,
    _listeners: {} as FakeNode["_listeners"],
    set textContent(value: string) {
      text = String(value);
      node.childNodes = [];
      node.children = [];
    },
    get textContent() {
      if (node.childNodes.length === 0) return text;
      return node.childNodes.map((child) => child.textContent ?? "").join("");
    },
    setAttribute(name: string, value: string) {
      this.attributes[name] = String(value);
    },
    getAttribute(name: string) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    removeAttribute(name: string) {
      delete this.attributes[name];
    },
    hasAttribute(name: string) {
      return name in this.attributes;
    },
    appendChild(child: FakeNode) {
      child.parentNode?.removeChild(child);
      child.parentNode = this;
      this.childNodes.push(child);
      if (child.nodeType === 1) this.children.push(child);
      return child;
    },
    removeChild(child: FakeNode) {
      this.childNodes = this.childNodes.filter((item) => item !== child);
      this.children = this.children.filter((item) => item !== child);
      child.parentNode = null;
      return child;
    },
    insertBefore(child: FakeNode, ref: FakeNode | null) {
      child.parentNode?.removeChild(child);
      child.parentNode = this;
      const index = ref ? this.childNodes.indexOf(ref) : -1;
      if (index < 0) this.childNodes.push(child);
      else this.childNodes.splice(index, 0, child);
      if (child.nodeType === 1) this.children.push(child);
      return child;
    },
    addEventListener(type: string, fn: (event: FakeEvent) => void) {
      (this._listeners[type] ||= []).push(fn);
    },
    removeEventListener(type: string, fn: (event: FakeEvent) => void) {
      this._listeners[type] = (this._listeners[type] || []).filter((listener) => listener !== fn);
    },
    focus() {
      owner.activeElement = this;
    },
    blur() {},
    contains(other: FakeNode) {
      if (this === other) return true;
      return this.childNodes.some((child) => child === other || child.contains?.(other));
    },
  } as FakeNode;
  Object.setPrototypeOf(node, HTMLElementBase.prototype);
  return node;
}

function installDocument(): FakeDocument {
  const document = {
    nodeType: 9,
    nodeName: "#document",
    childNodes: [] as FakeNode[],
    children: [] as FakeNode[],
    style: {},
    attributes: {},
    parentNode: null,
    ownerDocument: null,
    textContent: "",
    _listeners: {},
    activeElement: null as FakeNode | null,
    HTMLIFrameElement: HTMLIFrameElementBase,
  } as FakeDocument;
  document.ownerDocument = document;
  document.createElement = (tag) => createElementNode(tag, document);
  document.createElementNS = (_ns, tag) => createElementNode(tag, document);
  document.createTextNode = (value) => {
    const node = {
      nodeType: 3,
      nodeName: "#text",
      textContent: String(value),
      nodeValue: String(value),
      parentNode: null,
      ownerDocument: document,
      childNodes: [],
      children: [],
      style: {},
      attributes: {},
      _listeners: {},
    } as unknown as FakeNode;
    Object.setPrototypeOf(node, NodeBase.prototype);
    return node;
  };
  document.setAttribute = () => undefined;
  document.getAttribute = () => null;
  document.removeAttribute = () => undefined;
  document.hasAttribute = () => false;
  document.appendChild = (child) => child;
  document.removeChild = (child) => child;
  document.insertBefore = (child) => child;
  document.addEventListener = (type, fn) => {
    (document._listeners[type] ||= []).push(fn);
  };
  document.removeEventListener = (type, fn) => {
    document._listeners[type] = (document._listeners[type] || []).filter((listener) => listener !== fn);
  };
  document.focus = () => undefined;
  document.blur = () => undefined;
  document.contains = () => false;
  document.documentElement = document.createElement("html");
  document.body = document.createElement("body");
  document.documentElement.appendChild(document.body);
  document.activeElement = document.body;
  return document;
}

const document = installDocument();
Object.assign(globalThis, {
  document,
  window: globalThis,
  HTMLElement: HTMLElementBase,
  Element: ElementBase,
  Node: NodeBase,
  HTMLIFrameElement: HTMLIFrameElementBase,
  navigator: { userAgent: "node" },
  getSelection: () => null,
});

function fire(node: FakeNode, type: string) {
  const event = {
    type,
    target: node,
    currentTarget: null,
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 3,
    timeStamp: Date.now(),
    button: 0,
    buttons: 0,
    detail: 1,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    screenX: 0,
    screenY: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    relatedTarget: null,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this._stop = true;
    },
    isPropagationStopped() {
      return Boolean(this._stop);
    },
  } as FakeEvent;
  event.nativeEvent = event;
  const chain: FakeNode[] = [];
  let current: FakeNode | null = node;
  while (current) {
    chain.push(current);
    current = current.parentNode;
  }
  for (const element of chain) {
    event.currentTarget = element;
    for (const listener of element._listeners?.[type] || []) listener(event);
    if (event._stop) break;
  }
}

function walk(node: FakeNode, visit: (node: FakeNode) => void) {
  visit(node);
  for (const child of node.childNodes || []) walk(child, visit);
}

function byText(root: FakeNode, tag: string, text: string): FakeNode {
  let found: FakeNode | null = null;
  walk(root, (node) => {
    if (found) return;
    if (node.tagName === tag && node.textContent === text) found = node;
  });
  if (!found) throw new Error(`No ${tag} with text ${text}. Saw: ${root.textContent}`);
  return found;
}

function mount(node: ReactNode): Root {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host as unknown as Element);
  act(() => {
    root.render(node);
  });
  return root;
}

const labSlides: LessonPlanResourcePickerNode = {
  kind: "item",
  id: 7,
  title: "Lab slides",
  path: "Science",
  itemType: "file",
  visibility: "published",
  familyAccessWarning: null,
  children: [],
};

const labPacket = {
  id: 1,
  organizationId: 1,
  courseId: 1,
  unitId: null,
  title: "Lab packet",
  description: "",
  kind: "page",
  workType: "material",
  url: null,
  fileId: null,
  scheduledDate: null,
  dueDate: null,
  dueAt: null,
  dueTimezone: null,
  acceptSubmissions: false,
  allowSubmissionsPastDue: false,
  gradable: false,
  pointsPossible: null,
  submissionLimit: 1,
  submissionFileTypes: [],
  position: 0,
  currentVersion: 1,
  visibility: "published",
  deletedAt: null,
} as MaterialRecord;

test("checking a resource keeps the link content popup on Resources", () => {
  function Harness() {
    const [selected, setSelected] = useState<{ kind: "item"; id: number }[]>([]);
    return (
      <LinkContentModal
        open
        dayLabel="Mon, Sep 14"
        materials={[]}
        units={[]}
        selectedMaterialIds={[]}
        onToggleMaterial={() => undefined}
        resourceNodes={[labSlides]}
        selectedResources={selected}
        courseHasResourceLinks
        resourcesLoading={false}
        onToggleResource={(resource) => {
          setSelected((current) =>
            current.some((item) => item.kind === resource.kind && item.id === resource.id)
              ? current.filter((item) => item.id !== resource.id)
              : [...current, { kind: "item", id: resource.id }],
          );
        }}
        onClose={() => undefined}
      />
    );
  }

  const root = mount(createElement(Harness));
  try {
    assert.match(document.body.textContent, /Add materials to this course first/);
    act(() => {
      fire(byText(document.body, "BUTTON", "Resources"), "click");
    });
    assert.match(document.body.textContent, /Lab slides/);
    assert.equal(document.body.textContent.includes("Add materials to this course first"), false);
    const checkbox = (() => {
      let found: FakeNode | null = null;
      walk(document.body, (node) => {
        if (!found && node.tagName === "INPUT" && (node as { type?: string }).type === "checkbox") found = node;
      });
      if (!found) throw new Error("resource checkbox missing");
      return found;
    })();
    act(() => {
      fire(checkbox, "click");
    });
    assert.match(document.body.textContent, /Lab slides/);
    assert.match(document.body.textContent, /Linked/);
    assert.match(document.body.textContent, /1 resource/);
    assert.equal(document.body.textContent.includes("Add materials to this course first"), false);
    assert.equal(byText(document.body, "BUTTON", "Resources").getAttribute("aria-selected"), "true");
  } finally {
    act(() => {
      root.unmount();
    });
  }
});

test("checking a material keeps the link content popup on Materials", () => {
  function Harness() {
    const [selected, setSelected] = useState<number[]>([]);
    return (
      <LinkContentModal
        open
        dayLabel="Mon, Sep 14"
        materials={[labPacket]}
        units={[]}
        selectedMaterialIds={selected}
        onToggleMaterial={(materialId) => {
          setSelected((current) =>
            current.includes(materialId)
              ? current.filter((id) => id !== materialId)
              : [...current, materialId],
          );
        }}
        resourceNodes={[labSlides]}
        selectedResources={[]}
        courseHasResourceLinks
        resourcesLoading={false}
        onToggleResource={() => undefined}
        onClose={() => undefined}
      />
    );
  }

  const root = mount(createElement(Harness));
  try {
    assert.match(document.body.textContent, /Lab packet/);
    const checkbox = (() => {
      let found: FakeNode | null = null;
      walk(document.body, (node) => {
        if (!found && node.tagName === "INPUT" && (node as { type?: string }).type === "checkbox") found = node;
      });
      if (!found) throw new Error("material checkbox missing");
      return found;
    })();
    act(() => {
      fire(checkbox, "click");
    });
    assert.match(document.body.textContent, /Lab packet/);
    assert.match(document.body.textContent, /Linked/);
    assert.match(document.body.textContent, /1 material/);
    assert.equal(document.body.textContent.includes("Lab slides"), false);
    assert.equal(byText(document.body, "BUTTON", "Materials").getAttribute("aria-selected"), "true");
  } finally {
    act(() => {
      root.unmount();
    });
  }
});
