export const DASHBOARD_FEATURES = [
  { id: "products", label: "Manage Product Catalog", path: "/products", adminOnly: true  },
  { id: "categories", label: "Category Management", path: "/categories", adminOnly: true },
  { id: "users", label: "User Management", path: "/users" , adminOnly: true },
  { id: "inventory", label: "Inventory Management", path: "/inventory", adminOnly: true },
  { id: "orders", label: "My Orders", path: "/orders", adminOnly: false },
  { id: "view-orders", label: "View Orders", path: "/view-orders", adminOnly: true },
  { id: "my-earnings", label: "My Earnings Summary", path: "/my-earning", adminOnly: false },
  { id: "view-earnings", label: "View Earnings Summary", path: "/view-earning", adminOnly: true },
];
