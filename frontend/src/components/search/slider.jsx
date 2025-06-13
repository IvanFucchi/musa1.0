import * as React from "react"

import { cn } from "../../lib/utils"

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative flex w-full touch-none select-none items-center">
    <input
      type="range"
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-800",
        "range-thumb:h-4 range-thumb:w-4 range-thumb:rounded-full range-thumb:border-2 range-thumb:border-primary range-thumb:bg-background",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
Slider.displayName = "Slider"

export { Slider }