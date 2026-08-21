import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Collapse from "@mui/material/Collapse";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { Fragment, useMemo, useState } from "react";
import {
  MdEdit,
  MdVisibility,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdBlock,
  MdCheckCircle,
} from "react-icons/md";
import CategoryCarousel from "../CategoryCarousel";
import { USER_ROLES } from "../../constants/roles";
import { ActivityLogTable } from "./UserFormSections";
import {
  getActivityLog,
  getUserId,
  getUserSupportedPincodes,
  normalizeUserStatus,
} from "./userManagementUtils";

const PAGE_SIZE = 10;
const STATUS_FILTER_ALL = "all";
const STATUS_FILTER_ACTIVE = "Active";
const STATUS_FILTER_INACTIVE = "Inactive";

const UserList = ({
  users = [],
  status = "idle",
  error = null,
  isMobile = false,
  canManageUserStatus = false,
  onEdit,
  onView,
  onStatusToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return users.filter((item) => {
      const searchable = [
        item.firstname,
        item.lastname,
        item.email,
        item.userId,
        item.mobile,
        item.referencenumber,        
        item.role,
        item.aadharnumber,
        item.pincode,
        ...getUserSupportedPincodes(item),
        item.address,
        item.landmark,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearchTerm || searchable.includes(normalizedSearchTerm);
      const matchesRole = !roleFilter || item.role === roleFilter;
      const matchesStatus =
        statusFilter === STATUS_FILTER_ALL ||
        normalizeUserStatus(item.status) === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  return (
    <Card
      style={{
        height: "100%",
        width: "100%",
        overflowY: "visible",
        overflowX: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        border: "1px solid var(--brand-border)",
      }}
    >
      <CardContent style={{ padding: isMobile ? "8px 12px" : "16px" }}>
        <div
          style={{
            marginTop: 0,
            backgroundColor: "var(--brand-surface)",
            padding: "6px 0 0",
            borderRadius: "8px",
          }}
        >
          <CategoryCarousel
            items={USER_ROLES}
            selectedCategory={roleFilter}
            showSelectionBorder
            onCategorySelect={(role) => {
              setRoleFilter(role);
              setPage(1);
            }}
          />
        </div>

        <FormControl
          component="fieldset"
          style={{
            marginTop: isMobile ? "0.5em" : "0.75em",
            width: "100%",
          }}
        >          
          <RadioGroup
            row
            name="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            sx={{
              gap: isMobile ? "0.25em 0.5em" : "0.5em 1em",
              "& .MuiFormControlLabel-root": { marginRight: 0 },
              "& .MuiRadio-root": {
                color: "var(--brand-primary-strong)",
                "&.Mui-checked": { color: "var(--brand-primary-strong)" },
              },
            }}
          >
            <FormControlLabel value={STATUS_FILTER_ALL} control={<Radio size="small" />} label="All" />
            <FormControlLabel value={STATUS_FILTER_ACTIVE} control={<Radio size="small" />} label="Active" />
            <FormControlLabel
              value={STATUS_FILTER_INACTIVE}
              control={<Radio size="small" />}
              label="Inactive"
            />
          </RadioGroup>
        </FormControl>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: isMobile ? "0.25em" : "0.75em",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <TextField
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            size="small"
            style={{ flex: isMobile ? "0 0 auto" : "1 1 260px", width: "100%" }}
            label="Search users"
          />
        </div>

        {status === "loading" && <Typography style={{ marginTop: "1em" }}>Loading users...</Typography>}
        {status === "failed" && (
          <Typography color="error" style={{ marginTop: "1em" }}>
            {error}
          </Typography>
        )}

        {filteredUsers.length > 0 && (
          <TableContainer
            component={Paper}
            variant="outlined"
            style={{
              marginTop: "0.75em",
              overflowX: "auto",
              border: "1px solid var(--brand-border)",
              boxShadow: "none",
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                    First Name
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                    Last Name
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                    User ID
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                    Email
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                    Role
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                    Pincode
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                    Reference Number
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                    Status
                  </TableCell>
                  <TableCell
                    align="right"
                    style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)", minWidth: 120 }}
                  >
                    Action
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)", width: 40 }}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((item) => {
                  const expanded = expandedRowId === item.id;
                  const activityLog = getActivityLog(item);
                  const userStatus = normalizeUserStatus(item.status);
                  const isInactive = userStatus === "Inactive";

                  return (
                    <Fragment key={item.id}>
                      <TableRow hover>
                        <TableCell>{item.firstname || item.firstName || "—"}</TableCell>
                        <TableCell>{item.lastname || item.lastName || "—"}</TableCell>
                        <TableCell>{getUserId(item)}</TableCell>
                        <TableCell>{item.email || "—"}</TableCell>
                        <TableCell>{item.role || "—"}</TableCell>
                        <TableCell>{item.pincode || "—"}</TableCell>
                        <TableCell>{item.referencenumber || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={userStatus}
                            variant="outlined"
                            style={
                              isInactive
                                ? { color: "#d32f2f", borderColor: "#d32f2f" }
                                : {
                                    color: "var(--brand-primary-strong)",
                                    borderColor: "var(--brand-primary-strong)",
                                  }
                            }
                          />
                        </TableCell>
                        <TableCell align="right" style={{ whiteSpace: "nowrap" }}>
                          {canManageUserStatus ? (
                            <IconButton
                              onClick={() => onStatusToggle?.(item)}
                              size="small"
                              aria-label={isInactive ? "Activate user" : "Deactivate user"}
                              title={isInactive ? "Activate user" : "Deactivate user"}
                              style={{
                                color: isInactive ? "#d32f2f" : "#2e7d32",
                              }}
                            >
                              {isInactive ? <MdBlock size={20} /> : <MdCheckCircle size={20} />}
                            </IconButton>
                          ) : (
                            isInactive && (
                              <IconButton
                                size="small"
                                aria-label="User inactive"
                                title="Inactive user"
                                style={{ color: "#d32f2f", cursor: "default" }}
                                disableRipple
                              >
                                <MdBlock size={20} />
                              </IconButton>
                            )
                          )}
                          <IconButton
                            onClick={() => onView?.(item)}
                            size="small"
                            aria-label="View user"
                            title="View user"
                            style={{ color: "var(--brand-primary-strong)" }}
                          >
                            <MdVisibility size={20} />
                          </IconButton>
                          <IconButton
                            onClick={() => onEdit?.(item)}
                            size="small"
                            aria-label="Edit user"
                            title="Edit user"
                            style={{ color: "var(--brand-primary-strong)" }}
                          >
                            <MdEdit size={20} />
                          </IconButton>
                        </TableCell>
                        <TableCell align="center" style={{ width: 40 }}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setExpandedRowId((prev) => (prev === item.id ? null : item.id))
                            }
                            aria-label={expanded ? "Collapse activity log" : "Expand activity log"}
                            style={{ color: "var(--brand-primary-strong)" }}
                          >
                            {expanded ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          style={{ paddingBottom: 0, paddingTop: 0, borderBottom: expanded ? undefined : "none" }}
                        >
                          <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <div style={{ padding: "0.75em 0 1em" }}>
                              <ActivityLogTable history={activityLog} />
                            </div>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredUsers.length > 0 && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              marginTop: "1.5em",
              marginBottom: "0.5em",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              disabled={currentPage === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Typography variant="body2">
              Page {currentPage} of {totalPages}
            </Typography>
            <Button
              variant="outlined"
              disabled={currentPage === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        )}

        {status === "succeeded" && users.length === 0 && (
          <Typography style={{ marginTop: "1.5em", textAlign: "center", color: "#6f7378" }}>
            No users yet. Add your first user.
          </Typography>
        )}

        {status === "succeeded" && users.length > 0 && filteredUsers.length === 0 && (
          <Typography style={{ marginTop: "1.5em", textAlign: "center", color: "#6f7378" }}>
            No users match your filters.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default UserList;
