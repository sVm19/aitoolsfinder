"use client";

import React, { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useTiun } from "@/components/providers/tiun-provider";

interface CheckoutButtonProps {
  productId: string;
  referenceId?: string;
  children?: React.ReactNode;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export function CheckoutButton({
  productId,
  referenceId,
  children,
  label = "Upgrade with Tiun",
  variant = "primary",
  size = "md",
  className,
  onSuccess,
  onError,
  disabled = false,
}: CheckoutButtonProps) {
  const { checkout, isReady } = useTiun();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const res = await checkout({ productId, referenceId });
      onSuccess?.(res);
    } catch (err) {
      console.error("[CheckoutButton] Error initiating checkout:", err);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? "Opening checkout..." : children || label}
    </Button>
  );
}
