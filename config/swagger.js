// config/swagger.js
import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "V-Streamer API",
      version: "1.0.0",
      description: "API documentation for the V-Streamer backend project",
    },
    servers: [
      {
        url: "http://localhost:8080",
      },
    ],
  },
  apis: ["./routes/*.js"], // Route files with Swagger comments
};

export const swaggerSpec = swaggerJSDoc(options);
