import React, { useState } from "react";

export const Tabs = ({ children }) => {
  return <div className="w-full">{children}</div>;
};

export const TabsList = ({ children }) => {
  return <div className="flex border-b">{children}</div>;
};

export const TabsTrigger = ({ label, onClick, isActive }) => {
  return (
    <button
      className={`p-2 ${isActive ? "border-b-2 border-blue-500" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export const TabsContent = ({ children, isActive }) => {
  return isActive ? <div className="p-4">{children}</div> : null;
};
