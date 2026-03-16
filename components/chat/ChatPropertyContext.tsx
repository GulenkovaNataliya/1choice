"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ChatPropertyData = {
  property_id: string;
  property_code: string | null;
  property_title: string;
  property_slug: string;
  property_location: string | null;
};

type ChatPropertyContextValue = {
  propertyData: ChatPropertyData | null;
  setPropertyData: (data: ChatPropertyData | null) => void;
};

const ChatPropertyContext = createContext<ChatPropertyContextValue>({
  propertyData: null,
  setPropertyData: () => {},
});

export function ChatPropertyProvider({ children }: { children: ReactNode }) {
  const [propertyData, setPropertyData] = useState<ChatPropertyData | null>(null);
  return (
    <ChatPropertyContext.Provider value={{ propertyData, setPropertyData }}>
      {children}
    </ChatPropertyContext.Provider>
  );
}

export function useChatProperty() {
  return useContext(ChatPropertyContext);
}
