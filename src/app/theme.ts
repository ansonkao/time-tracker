import { createTheme } from "@mantine/core";

const theme = createTheme({
  breakpoints: {
    xs: "36em",
    sm: "48em",
    md: "62em",
    lg: "75em",
    xl: "88em",
  },
  colors: {
    brand: [
      // https://smart-swatch.netlify.app/#7C20C8
      "#f7e7ff",
      "#ddbcf8",
      "#c590ef",
      "#ac65e7",
      "#9439df",
      "#7b20c6",
      "#5f189b",
      "#441170",
      "#300a4e",
      "#210638",
    ],
    // brand: [
    //   "#e6f7ff",
    //   "#bae7ff",
    //   "#91d5ff",
    //   "#69c0ff",
    //   "#40a9ff",
    //   "#1890ff",
    //   "#096dd9",
    //   "#0050b3",
    //   "#003a8c",
    //   "#002766",
    // ],
  },
});

export default theme;
