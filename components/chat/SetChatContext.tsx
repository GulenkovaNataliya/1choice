"use client";

import { useEffect } from "react";
import { useChatProperty, type ChatPropertyData } from "./ChatPropertyContext";

export default function SetChatContext({ data }: { data: ChatPropertyData }) {
  const { setPropertyData } = useChatProperty();

  useEffect(() => {
    setPropertyData(data);
    return () => setPropertyData(null);
  }, [data.property_id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
