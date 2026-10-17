import { queryKeys } from "../queryKeys";

describe("queryKeys factory", () => {
  it("constructs hierarchical dashboard and parentDashboard keys with matching prefixes", () => {
    expect(queryKeys.dashboard.all).toEqual(["dashboard"]);
    expect(queryKeys.dashboard.byUser(42)).toEqual(["dashboard", 42]);
    expect(queryKeys.dashboard.page(42, 2)).toEqual(["dashboard", 42, 2]);

    expect(queryKeys.parentDashboard.all).toEqual(["parentDashboard"]);
    expect(queryKeys.parentDashboard.byUser(7)).toEqual(["parentDashboard", 7]);
    expect(queryKeys.parentDashboard.page(7, 1)).toEqual(["parentDashboard", 7, 1]);
  });

  it("constructs wallet, payouts, bookings, and supportTickets keys", () => {
    expect(queryKeys.wallet.all).toEqual(["wallet"]);
    expect(queryKeys.wallet.byUser(10)).toEqual(["wallet", 10]);
    expect(queryKeys.wallet.paginated(3, "deposit")).toEqual(["wallet", 3, "deposit"]);

    expect(queryKeys.payouts.byUser(10)).toEqual(["payouts", 10]);
    expect(queryKeys.bookings.byUser(10)).toEqual(["bookings", 10]);
    expect(queryKeys.supportTickets.page(10, 2)).toEqual(["support-tickets", 10, 2]);
  });

  it("constructs discovery and teacher keys deterministically", () => {
    expect(queryKeys.discovery.subjects).toEqual(["discovery-subjects"]);
    expect(queryKeys.discovery.gradeLevels).toEqual(["grade-levels"]);
    expect(queryKeys.discovery.teachers("math", "3", "rating", 2)).toEqual([
      "discovery-teachers",
      "math",
      "3",
      "rating",
      2,
    ]);
    expect(queryKeys.teacherSlots.publicByTeacher(99)).toEqual(["teacher-slots-public", "99"]);
    expect(queryKeys.teacherReviews.publicByTeacher(99, 1)).toEqual([
      "teacher-reviews-public",
      99,
      1,
    ]);
  });
});
