import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonthGrid } from "@/components/calendar/MonthGrid";

describe("MonthGrid", () => {
  it("해당 월의 날짜 숫자를 렌더한다", () => {
    render(
      <MonthGrid
        year={2026}
        month={6}
        events={[]}
        selectedDate={new Date(2026, 6, 10)}
        onSelectDate={vi.fn()}
      />
    );
    // 7월 15일 셀 존재
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("일정이 있는 날에는 점(dot)을 표시한다", () => {
    render(
      <MonthGrid
        year={2026}
        month={6}
        events={[
          { id: "1", user_id: "u", title: "회의", date: "2026-07-10",
            start_time: null, end_time: null, is_all_day: true,
            color: "#A7F3D0", memo: null, is_public: false, created_at: "" },
        ]}
        selectedDate={new Date(2026, 6, 10)}
        onSelectDate={vi.fn()}
      />
    );
    expect(screen.getByTestId("dot-2026-07-10")).toBeInTheDocument();
  });
});
