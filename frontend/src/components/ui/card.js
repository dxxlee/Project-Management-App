import React from "react";

export const Card = ({ children }) => {
  return <div className="bg-white p-4 rounded-lg shadow-md">{children}</div>;
};

export const CardHeader = ({ children }) => {
  return <div className="border-b p-2">{children}</div>;
};

export const CardTitle = ({ children }) => {
  return <h2 className="text-lg font-bold">{children}</h2>;
};

export const CardContent = ({ children }) => {
  return <div className="p-2">{children}</div>;
};
