"use client";

import dynamic from "next/dynamic";

const ParticleFieldInner = dynamic(
  () => import("@/components/particle-field").then((m) => m.ParticleField),
  { ssr: false }
);

export function ParticleFieldWrapper() {
  return <ParticleFieldInner />;
}
