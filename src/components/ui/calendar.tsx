import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { buttonVariants } from "@/components/ui/button-variants"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  buttonVariant = "outline",
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  return (
    <div className="bg-white rounded-lg border shadow-md p-3">
      <DayPicker
        showOutsideDays={showOutsideDays}
        captionLayout="dropdown"  // ✅ ahora lo activamos aquí
        fromYear={2020}
        toYear={2030}
        disableNavigation={false}
        className={cn(
          "group/calendar [--cell-size:2.25rem] text-gray-900 dark:text-gray-100",
          className
        )}
        classNames={{
          root: "w-fit mx-auto",
          months: "flex flex-col md:flex-row gap-4",
          month: "flex w-full flex-col gap-2",
          nav: "absolute inset-x-0 top-1 flex w-full items-center justify-between px-2",
          button_previous: cn(
            buttonVariants({ variant: buttonVariant }),
            "h-[--cell-size] w-[--cell-size] rounded-full hover:bg-blue-50 text-blue-600 transition"
          ),
          button_next: cn(
            buttonVariants({ variant: buttonVariant }),
            "h-[--cell-size] w-[--cell-size] rounded-full hover:bg-blue-50 text-blue-600 transition"
          ),
          month_caption:
            "flex h-[--cell-size] w-full items-center justify-center text-blue-700 font-medium",
          dropdowns: "flex gap-2 justify-center items-center",
          dropdown_root:
            "relative border border-gray-300 rounded-md px-2 py-1 text-sm bg-white hover:border-blue-400 focus:ring focus:ring-blue-200 transition",
          dropdown:
            "absolute inset-0 opacity-0 cursor-pointer",
          weekdays:
            "grid grid-cols-7 text-xs font-semibold text-gray-500 uppercase mt-2",
          weekday: "flex justify-center",
          week: "grid grid-cols-7",
          day: cn(
            "group/day relative aspect-square text-sm transition-all",
            "data-[selected=true]:bg-blue-600 data-[selected=true]:text-white data-[selected=true]:rounded-lg",
            "hover:bg-blue-100 hover:text-blue-800 rounded-lg",
            "focus-visible:ring-2 focus-visible:ring-blue-400"
          ),
          outside: "text-gray-400",
          disabled: "text-gray-300 opacity-50",
          today: "font-bold text-blue-700 underline underline-offset-4",
          hidden: "invisible",
          ...classNames,
        }}
        components={{
          Root: ({ className, rootRef, ...props }) => (
            <div ref={rootRef} className={cn(className)} {...props} />
          ),
          Chevron: ({ className, orientation, ...props }) =>
            orientation === "left" ? (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            ) : orientation === "right" ? (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            ) : (
              <ChevronDownIcon className={cn("size-4", className)} {...props} />
            ),
          DayButton: CalendarDayButton,
          ...components,
        }}
        {...props}
      />
    </div>
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      className={cn(
        "flex aspect-square items-center justify-center text-sm transition-all",
        "hover:bg-blue-100 hover:text-blue-700 rounded-md",
        "data-[selected=true]:bg-blue-600 data-[selected=true]:text-white",
        "aria-selected:bg-blue-600 aria-selected:text-white",
        "focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
