import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Chip from "@mui/material/Chip";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { PINCODE_API_URL } from "../../constants/api";
import { ADMIN_ROLE, USER_ROLES } from "../../constants/roles";
import { FEATURE_LABELS } from "../../constants/dashboardFeatures";
import {
  formatActivityDateDisplay,
  getImageUrl,
  getUserSupportedPincodes,
  mapReferenceNumberFromUserId,
  shouldShowBankDetails,
  toUpdateActivityRows,
} from "./userManagementUtils";

const ActivityLogTable = ({ history = [], title = "Activity Log" }) => {
  const orderedHistory = toUpdateActivityRows(history);

  return (
    <div style={{ marginTop: "0.5em", gridColumn: "1 / -1" }}>
      <Typography
        variant="body2"
        style={{ fontWeight: 600, color: "var(--brand-primary)", marginBottom: "0.5em" }}
      >
        {title}
      </Typography>
      <TableContainer
        component={Paper}
        variant="outlined"
        style={{ border: "1px solid var(--brand-border)", boxShadow: "none" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: 700, color: "var(--brand-primary)", backgroundColor: "var(--brand-surface)" }}>
                Role
              </TableCell>
              <TableCell style={{ fontWeight: 700, color: "var(--brand-primary)", backgroundColor: "var(--brand-surface)" }}>
                Reference Number
              </TableCell>
              <TableCell style={{ fontWeight: 700, color: "var(--brand-primary)", backgroundColor: "var(--brand-surface)" }}>
                Modified By
              </TableCell>
              <TableCell style={{ fontWeight: 700, color: "var(--brand-primary)", backgroundColor: "var(--brand-surface)" }}>
                Modified At
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderedHistory.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} style={{ textAlign: "center", color: "#6f7378" }}>
                  No activity yet.
                </TableCell>
              </TableRow>
            )}
            {orderedHistory.map((entry, index) => (
              <TableRow key={`${entry.modifiedAt}-${entry.modifiedBy}-${index}`}>
                <TableCell>{entry.role || "—"}</TableCell>
                <TableCell>{entry.referencenumber || "—"}</TableCell>
                <TableCell>{entry.modifiedBy || "—"}</TableCell>
                <TableCell>{formatActivityDateDisplay(entry.modifiedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

const ImageUploadSection = ({
  imageKeys = [],
  disabled = false,
  uploadingFiles = false,
  fileInputRef,
  onFileUpload,
  onRemoveFile,
}) => (
  <div>
    {!disabled && (
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFileUpload}
        disabled={uploadingFiles}
        accept="image/*"
      />
    )}
    {uploadingFiles && (
      <Typography variant="body2" style={{ marginTop: "0.5em", color: "#1976d2" }}>
        Uploading files...
      </Typography>
    )}
    {imageKeys.length > 0 && (
      <div style={{ marginTop: "1em" }}>
        <Typography variant="body2" style={{ fontWeight: "bold", marginBottom: "0.5em" }}>
          Uploaded Images:
        </Typography>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: "0.75em",
          }}
        >
          {imageKeys.map((key, index) => (
            <div
              key={`${key}-${index}`}
              style={{
                position: "relative",
                width: "100%",
                paddingBottom: "100%",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <img
                src={getImageUrl(key)}
                alt="Uploaded thumbnail"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: "4px",
                }}
              />
              {!disabled && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => onRemoveFile(index)}
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    padding: "2px 4px",
                    minWidth: "auto",
                  }}
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const PrivilegesSection = ({
  privileges = [],
  onToggle,
  disabled = false,
  role = "",
}) => {
  const privilegeOptions = useMemo(() => {
    const baseLabels = FEATURE_LABELS.filter(
      (feature) =>
        !["onboarding-report", "reports"].includes(feature.id),
    );
    if (role !== ADMIN_ROLE) return baseLabels;

    const reportsFeature =
      FEATURE_LABELS.find((feature) => feature.id === "reports") || {
        id: "reports",
        label: "Reports",
        path: "/reports",
      };

    return [...baseLabels, reportsFeature];
  }, [role]);

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <Typography
        variant="body2"
        style={{ fontWeight: 600, color: "var(--brand-primary-strong)", marginBottom: "0.5em" }}
      >
        Privileges
      </Typography>
      <FormGroup
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "0.25em 1em",
        }}
      >
        {privilegeOptions.map((feature) => (
          <FormControlLabel
            key={feature.id}
            control={
              <Checkbox
                checked={privileges.includes(feature.id)}
                onChange={() => onToggle(feature.id)}
                disabled={disabled}
                size="small"
                sx={{ color: "var(--brand-primary-strong)", "&.Mui-checked": { color: "var(--brand-primary-strong)" } }}
              />
            }
            label={feature.label}
          />
        ))}
      </FormGroup>
    </div>
  );
};

const SupportedPincodesSection = ({
  supportedpincodes = [],
  disabled = false,
  onAdd,
  onRemove,
  allUsers = [],
  currentUserId = null,
}) => {
  const [pincodeOptions, setPincodeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPincodes, setSelectedPincodes] = useState(supportedpincodes || []);

  // Extract pincodes already assigned to other users and map to user info
  const assignedPincodesMap = useMemo(() => {
    const assigned = {};
    allUsers.forEach((user) => {
      // Skip the current user being edited
      if (currentUserId && (user.id === currentUserId || user.userId === currentUserId)) {
        return;
      }
      const userPincodes = getUserSupportedPincodes(user);
      const userId = user.userId || user.id || "Unknown";
      userPincodes.forEach((pincode) => {
        assigned[pincode] = userId;
      });
    });
    return assigned;
  }, [allUsers, currentUserId]);

  useEffect(() => {
    const fetchPincodes = async () => {
      setLoading(true);
      try {
        const response = await fetch(PINCODE_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          const pincodes = Array.isArray(data?.result) ? data.result : [];
          setPincodeOptions(pincodes);
        } else {
          toast.error("Failed to load pincode options");
        }
      } catch {
        toast.error("Error loading pincodes");
      } finally {
        setLoading(false);
      }
    };

    fetchPincodes();
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- sync selected pincodes from parent */
  useEffect(() => {
    setSelectedPincodes(supportedpincodes || []);
  }, [supportedpincodes]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePincodeChange = (event) => {
    const value = event.target.value;
    setSelectedPincodes(value);
    
    // Get the old pincodes and new pincodes
    const oldSet = new Set(supportedpincodes);
    const newSet = new Set(value);
    
    // Find added and removed pincodes
    const added = value.filter((v) => !oldSet.has(v));
    const removed = supportedpincodes.filter((v) => !newSet.has(v));
    
    // Notify parent component of changes
    added.forEach((pincode) => onAdd(pincode));
    removed.forEach((pincode) => onRemove(pincode));
  };

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <FormControl fullWidth size="small" disabled={disabled || loading}>
        <InputLabel>Supported Pincodes</InputLabel>
        <Select
          multiple
          value={selectedPincodes}
          onChange={handlePincodeChange}
          label="Supported Pincodes"
          endAdornment={loading ? <CircularProgress color="inherit" size={20} /> : null}
          renderValue={(selected) => selected.join(", ")}
        >
          {pincodeOptions.map((option) => {
            const assignedUserId = assignedPincodesMap[option.pincode];
            const isAssigned = !!assignedUserId && !selectedPincodes.includes(option.pincode);
            const isSelected = selectedPincodes.includes(option.pincode);
            return (
              <MenuItem
                key={`${option.pincode}-${option.city}`}
                value={option.pincode}
                disabled={isAssigned}
                style={{
                  backgroundColor: isSelected ? "var(--brand-tint)" : isAssigned ? "#f5f5f5" : "transparent",
                  color: isSelected ? "var(--brand-primary-strong)" : isAssigned ? "#999" : "inherit",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {option.pincode} - {option.city}
                {assignedUserId ? ` (Assigned to ${assignedUserId})` : ""}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      {selectedPincodes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5em", marginTop: "0.75em" }}>
          {selectedPincodes.map((pincode) => (
            <Chip
              key={pincode}
              label={pincode}
              size="small"
              onDelete={disabled ? undefined : () => handlePincodeChange({
                target: {
                  value: selectedPincodes.filter((p) => p !== pincode)
                }
              })}
              style={{ backgroundColor: "var(--brand-tint)", color: "var(--brand-primary-strong)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RoleSelectField = ({ user, onChange, disabled = false, fullWidth = false }) => (
  <TextField
    select={!disabled}
    size="small"
    label="Role"
    variant="outlined"
    name="role"
    value={user.role}
    onChange={onChange}
    disabled={disabled}
    required={!disabled}
    fullWidth={fullWidth}
  >
    {!disabled && (
      <MenuItem value="" disabled>
        Select role
      </MenuItem>
    )}
    {USER_ROLES.map((role) => (
      <MenuItem key={role} value={role}>
        {role}
      </MenuItem>
    ))}
  </TextField>
);

const UserFormFields = ({
  user,
  onChange,
  onPrivilegeToggle,
  onAddSupportedPincode,
  onRemoveSupportedPincode,
  showSupportedPincodes = false,
  disabled = false,
  isMobile,
  profileMode = false,
  extendedUserForm = false,
  allUsers = [],
  currentUserId = null,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
      gap: "1em",
      width: "100%",
    }}
  >
    {extendedUserForm && (
      <TextField
        size="small"
        label="User ID"
        variant="outlined"
        name="userid"
        value={user.userid || ""}
        disabled
        style={{ gridColumn: "1 / -1" }}
      />
    )}
    <TextField
      size="small"
      label="First Name"
      variant="outlined"
      name="firstname"
      value={user.firstname}
      helperText="Please enter the correct first name, as per the Bank records"
      maxLength={50}
      onChange={onChange}
      disabled={disabled}
      required={!disabled}
    />
    <TextField
      size="small"
      label="Last Name"
      variant="outlined"
      name="lastname"
      value={user.lastname}
      helperText="Please enter the correct last name, as per the Bank records"
      maxLength={50}
      onChange={onChange}
      disabled={disabled}
      required={!disabled}
    />
    <TextField
      size="small"
      label="Email"
      variant="outlined"
      name="email"
      type="email"
      value={user.email}
      onChange={onChange}
      disabled={disabled}
      required={!disabled}
    />
    <TextField
      size="small"
      label="Mobile"
      variant="outlined"
      name="mobile"
      value={user.mobile}
      onChange={onChange}
      disabled={disabled}
      inputProps={{ maxLength: 10, readOnly: disabled }}
      required={!disabled}
    />
    {!extendedUserForm && (
      <RoleSelectField user={user} onChange={onChange} disabled={disabled} />
    )}
    <TextField
      size="small"
      label="Aadhar Number"
      variant="outlined"
      name="aadharnumber"
      value={user.aadharnumber}
      onChange={onChange}
      disabled={disabled}
      inputProps={{ maxLength: 12, readOnly: disabled }}
      required={!disabled}
    />
    <TextField
      size="small"
      label="Pincode"
      variant="outlined"
      name="pincode"
      value={user.pincode}
      onChange={onChange}
      disabled={disabled}
      inputProps={{ maxLength: 6, readOnly: disabled }}
      required={!disabled}
      helperText={!disabled ? "Enter the correct pin code" : undefined}
    />
    {showSupportedPincodes && (
      <SupportedPincodesSection
        supportedpincodes={user.supportedpincodes || []}
        disabled={disabled}
        onAdd={onAddSupportedPincode}
        onRemove={onRemoveSupportedPincode}
        allUsers={allUsers}
        currentUserId={currentUserId}
      />
    )}
    <TextField
      size="small"
      label="Landmark"
      variant="outlined"
      name="landmark"
      value={user.landmark}
      onChange={onChange}
      disabled={disabled}
    />
    <TextField
      size="small"
      label="Address"
      variant="outlined"
      name="address"
      value={user.address}
      onChange={onChange}
      disabled={disabled}
      multiline
      minRows={2}
      required={!disabled}
      style={isMobile ? undefined : { gridColumn: "1 / -1" }}
    />
    {shouldShowBankDetails(user.role) && (
      <>
        <TextField
          size="small"
          label="Bank Name"
          variant="outlined"
          name="bankname"
          value={user.bankname || ""}
          onChange={onChange}
          disabled={disabled}
          inputProps={{ readOnly: disabled }}
        />
        <TextField
          size="small"
          label="Account No"
          variant="outlined"
          name="accountno"
          value={user.accountno || ""}
          onChange={onChange}
          disabled={disabled}
          inputProps={{ readOnly: disabled }}
        />
        <TextField
          size="small"
          label="IFSC Code"
          variant="outlined"
          name="ifsccode"
          value={user.ifsccode || ""}
          onChange={onChange}
          disabled={disabled}
          inputProps={{ maxLength: 11, readOnly: disabled }}
        />
      </>
    )}
    {!profileMode && (
      <PrivilegesSection
        privileges={user.privileges || []}
        onToggle={onPrivilegeToggle}
        disabled={disabled}
        role={user.role}
      />
    )}
  </div>
);

const StatusToggle = ({ status = "Active", onChange, disabled = false }) => (
  <FormControlLabel
    style={{ marginLeft: 0 }}
    control={
      <Switch
        name="status"
        checked={status === "Active"}
        onChange={onChange}
        disabled={disabled}
        color="primary"
      />
    }
    label={`Status: ${status === "Active" ? "Active" : "Inactive"}`}
  />
);

const ProfileUserSelectTable = ({
  users,
  filter,
  onFilterChange,
  selectedUserId,
  onSelectUser,
}) => {
  const filteredUsers = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    if (!normalizedFilter) return users;

    return users.filter((item) => {
      const searchable = [
        item.firstname,
        item.firstName,
        item.lastname,
        item.lastName,
        item.email,
        item.role,
        item.userId,
        item.referencenumber,
        item.referenceNumber,
        item.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedFilter);
    });
  }, [filter, users]);

  return (
    <div style={{ gridColumn: "1 / -1", marginTop: "0.5em" }}>
      <Typography
        variant="body2"
        style={{ fontWeight: 600, color: "var(--brand-primary-strong)", marginBottom: "0.75em" }}
      >
        Select User
      </Typography>
      <TextField
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        size="small"
        label="Search user"
        fullWidth
        style={{ marginBottom: "0.75em" }}
      />
      <TableContainer
        component={Paper}
        variant="outlined"
        style={{
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
                Email
              </TableCell>
              <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                Role
              </TableCell>
              <TableCell style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)" }}>
                User ID
              </TableCell>
              <TableCell
                align="center"
                style={{ fontWeight: 700, color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-surface)", width: 80 }}
              >
                Select
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: "center", color: "#6f7378" }}>
                  No users match your filter.
                </TableCell>
              </TableRow>
            )}
            {filteredUsers.map((item) => (
              <TableRow
                key={item.id}
                hover
                selected={selectedUserId === item.id}
                onClick={() => onSelectUser(item)}
                style={{ cursor: "pointer" }}
              >
                <TableCell>{item.firstname || item.firstName || "—"}</TableCell>
                <TableCell>{item.lastname || item.lastName || "—"}</TableCell>
                <TableCell>{item.email || "—"}</TableCell>
                <TableCell>{item.role || "—"}</TableCell>
                <TableCell>{mapReferenceNumberFromUserId(item) || "—"}</TableCell>
                <TableCell align="center">
                  <Radio
                    checked={selectedUserId === item.id}
                    onChange={() => onSelectUser(item)}
                    value={item.id}
                    size="small"
                    sx={{ color: "var(--brand-primary-strong)", "&.Mui-checked": { color: "var(--brand-primary-strong)" } }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

const ReferenceNumberFields = ({
  user,
  users,
  filter,
  onFilterChange,
  selectedReferenceUserId,
  onSelectUser,
  onChange,
  showDiscountRate = false,
  profileMode = false,
  disabled = false,
  roleDisabled = true,
  canEditReferenceNumber = false,
  savedReferenceNumber = "",
}) => {
  const hasSavedReferenceNumber = Boolean(String(savedReferenceNumber || "").trim());
  const referenceNumberDisabled =
    disabled || (!canEditReferenceNumber && hasSavedReferenceNumber);
  const roleFieldDisabled =
    disabled || roleDisabled || (!canEditReferenceNumber && hasSavedReferenceNumber);

  return (
  <>
    {profileMode ? (
      <>
        <TextField
          size="small"
          label="Reference Number"
          variant="outlined"
          name="referencenumber"
          value={user.referencenumber}
          onChange={onChange}
          disabled={referenceNumberDisabled}
          fullWidth
        />
        <RoleSelectField
          user={user}
          onChange={onChange}
          disabled={roleFieldDisabled}
          fullWidth
        />
      </>
    ) : (
      <>
        {user.role !== ADMIN_ROLE && (
          <ProfileUserSelectTable
            users={users}
            filter={filter}
            onFilterChange={onFilterChange}
            selectedUserId={selectedReferenceUserId}
            onSelectUser={onSelectUser}
          />
        )}
        <RoleSelectField user={user} onChange={() => {}} disabled fullWidth />
        <TextField
          size="small"
          label="Reference Number"
          variant="outlined"
          name="referencenumber"
          value={user.referencenumber}
          onChange={onChange}
          disabled
          fullWidth
        />
      </>
    )}
    {showDiscountRate && (
      <TextField
        size="small"
        label="Discount Rate (%)"
        variant="outlined"
        name="discountrate"
        type="number"
        value={user.discountrate ?? 0}
        onChange={onChange}
        disabled={disabled}
        inputProps={{ min: 0, max: 100, step: 1, readOnly: disabled }}
        helperText={!disabled ? "Maximum discount is 100%" : undefined}
        fullWidth
      />
    )}
  </>
  );
};

export {
  ActivityLogTable,
  ImageUploadSection,
  PrivilegesSection,
  SupportedPincodesSection,
  RoleSelectField,
  UserFormFields,
  StatusToggle,
  ProfileUserSelectTable,
  ReferenceNumberFields,
};
