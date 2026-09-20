import type { Preview } from "@storybook/react-vite";
import "@/styles/index.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      options: {
        paper: { name: "Paper", value: "#F7F5EE" },
        surface: { name: "Surface", value: "#FFFFFF" },
      },
    },
    a11y: {
      test: "todo",
    },
    viewport: {
      options: {
        iphone: {
          name: "iPhone",
          styles: { width: "390px", height: "844px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "paper" },
    viewport: { value: "iphone", isRotated: false },
  },
};

export default preview;
