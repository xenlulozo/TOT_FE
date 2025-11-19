
"use client"

import confetti from "canvas-confetti"

import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"
import { Confetti, ConfettiRef } from "@/components/ui/confetti"


export function ConfettiDemo() {
  const confettiRef = useRef<ConfettiRef>(null)

  return (
    <Confetti
    ref={confettiRef}
    className="absolute top-0 left-0 z-0 size-full"
    onMouseEnter={() => {
      confettiRef.current?.fire({})
    }}
  />
  )
}


export const A_comratulation = () => {
  useEffect(() => {
    const end = Date.now() + 3 * 1000 // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]

    const frame = () => {
      if (Date.now() > end) return

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      })

      requestAnimationFrame(frame)
    }

    frame()

    // no cleanup needed, animation short lived
  }, [])

  return null
}
export function ConfettiSideCannons() {


  return (
    <Confetti
    className="absolute top-0 left-0 z-0 size-full"
    ></Confetti>
  )
}
