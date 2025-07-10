import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { FloatingToastItem } from "./FloatingToastItem"; // Import our new logic component

/**
 * A container that displays and animates a stack of floating notifications.
 * This component is responsible for the list and the animations.
 */
export function FloatingNotification({ notifications, onDismiss }) {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    // This outer div is the fixed container for the entire stack
    <div className="fixed top-24 left-4 z-50 w-80 flex flex-col items-stretch gap-3">
      <AnimatePresence>
        {/* We map over the notifications list */}
        {notifications.map((alert) => (
          // For each alert, we create a `motion.div` to handle its animation.
          // This is the recommended pattern for list animations.
          <motion.div
            key={alert.id} // The key is crucial for AnimatePresence
            layout // Animates the re-ordering when an item is removed
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ x: "-110%", opacity: 0, height: 0, padding: 0, margin: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            {/* Inside the animated wrapper, we render our logic component */}
            <FloatingToastItem alert={alert} onDismiss={onDismiss} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
