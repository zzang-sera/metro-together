import { useState, useEffect } from "react";
import { findAccessiblePath } from "../api/metro/pathfinderAPI";

export function usePathFinder(start, end, isWheelchair = false) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!start || !end) return;

    async function fetchPath() {
      setLoading(true);
      setError(null);
      try {
        const data = await findAccessiblePath(start, end, { wheelchair: isWheelchair });
        setResult(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPath();
  }, [start, end, isWheelchair]);

  return { result, loading, error };
}
