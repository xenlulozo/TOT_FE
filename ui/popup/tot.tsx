"use client";

import { useUIStore } from "@/stores/UIStore";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";


export function TotPopup() {
  const popup = useUIStore((s) => s.popup);

  return (
    <>
      {popup === "tot" && <BasicPopup />}
    </>
  );
}

export default function BasicPopup() {
  const popup = useUIStore((s) => s.popup);
  const close = useUIStore((s) => s.closePopup);
  const [inputValue, setInputValue] = useState("");

  const ref = useRef<HTMLDivElement>(null);

  // click outside để đóng
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  return (
    <AnimatePresence>
      {popup === "tot" && (
   <motion.div
   className="absolute mt-2 w-60 bg-white border rounded shadow p-4"
   initial={{ opacity: 0, y: 0 }}
   animate={{ opacity: 1, y: 0 }}
   exit={{ opacity: 0, y: 0 }}
 >
   <input
     type="text"
     placeholder="Type here"
     className="border p-2 w-full rounded"
   />
 </motion.div>
 
      )}
    </AnimatePresence>
  );
}