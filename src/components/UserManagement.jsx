import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router";
import { fetchUsers } from "../store/slices/usersSlice";
import { createUser, updateUser } from "../api/users";
import CategoryCarousel from "./CategoryCarousel";
import { PRESIGNED_URL_API, S3_BASE_URL } from "../constants/api";
import { ADMIN_ROLE, USER_ROLES } from "../constants/roles";
import {
  FEATURE_LABELS,
  getDashboardHomePath,
  getDefaultPrivilegeIdsByRole,
  getUserRoleFromList,
  parseUserPrivileges,
} from "../constants/dashboardFeatures";
import {
  markProfileSetupSkipped,
} from "../helpers/profileHelpers";
import { ToastContainer, toast } from "react-toastify";
import { MdEdit, MdPersonAdd, MdVisibility } from "react-icons/md";
import "react-toastify/dist/ReactToastify.css";
import useMediaQuery from "@mui/material/useMediaQuery";

const INITIAL_USER_FORM = {
  userid: "",
  firstname: "",
  lastname: "",
  email: "",
  mobile: "",
  referencenumber: "",
  role: "",
  aadharnumber: "",
  pincode: "",
  address: "",
  landmark: "",
  imageKeys: [],
  privileges: [],
  discountrate: 0,
};

const getUserId = (user) => user.userId || user.email || user.id || "—";

const mapReferenceNumberFromUserId = (selectedUser) =>
  selectedUser?.userId || selectedUser?.referencenumber || selectedUser?.referenceNumber || "";

const getAssignedRoleFromReferenceUser = (selectedUser) => {
  switch (selectedUser?.role) {
    case ADMIN_ROLE:
      return "Super Stockist";
    case "Super Stockist":
      return "Stockist";
    case "Stockist":
      return "Dealer";
    case "Dealer":
      return "Customer";
    default:
      return selectedUser?.role || "";
  }
};

const getDefaultDiscountRateByRole = (role) => {
  switch (role) {
    case "Super Stockist":
      return 5;
    case "Stockist":
      return 2;
    case "Dealer":
      return 10;
    default:
      return 0;
  }
};

const getUserDiscountRate = (selectedUser) => {
  const raw = selectedUser?.discountrate ?? selectedUser?.discountRate ?? null;
  if (raw !== null && raw !== undefined && raw !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : getDefaultDiscountRateByRole(selectedUser?.role);
  }
  return getDefaultDiscountRateByRole(selectedUser?.role || "");
};

const findUserByReferenceNumber = (users, referenceNumber) => {
  const normalized = (referenceNumber || "").trim();
  if (!normalized) return null;

  return (
    users.find(
      (item) =>
        mapReferenceNumberFromUserId(item) === normalized || item.userId === normalized,
    ) || null
  );
};

const getUserImageKeys = (selectedUser) => {
  const raw =
    selectedUser?.imageKeys ??
    selectedUser?.imagekeys ??
    selectedUser?.images ??
    selectedUser?.fileKeys ??
    selectedUser?.filekeys ??
    selectedUser?.imageKey ??
    selectedUser?.imagekey ??
    selectedUser?.fileKey ??
    selectedUser?.filekey;

  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // not JSON
    }
    return raw ? [raw] : [];
  }
  return [];
};

const getUserPrivileges = (selectedUser) => parseUserPrivileges(selectedUser);

const mapUserToForm = (selectedUser) => {
  const role = selectedUser.role || "";

  return {
    userid: selectedUser.userId || "",
    firstname: selectedUser.firstname || selectedUser.firstName || "",
    lastname: selectedUser.lastname || selectedUser.lastName || "",
    email: selectedUser.email || "",
    mobile: selectedUser.mobile || "",
    referencenumber: selectedUser.referencenumber || selectedUser.referenceNumber || "",
    role,
    aadharnumber: selectedUser.aadharnumber || selectedUser.aadharNumber || "",
    address: selectedUser.address || "",
    landmark: selectedUser.landmark || "",
    pincode: selectedUser.pincode || "",
    imageKeys: getUserImageKeys(selectedUser),
    privileges: getUserPrivileges(selectedUser),
    discountrate: getUserDiscountRate(selectedUser),
  };
};

const mapProfileUserToForm = (selectedUser) => ({
  ...mapUserToForm(selectedUser),
  userid: selectedUser.userId || "",
});

const getImageUrl = (imageKey) => `${S3_BASE_URL}/${imageKey}`;

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
}) => (
  <div style={{ gridColumn: "1 / -1" }}>
    <Typography
      variant="body2"
      style={{ fontWeight: 600, color: "#165d46", marginBottom: "0.5em" }}
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
      {FEATURE_LABELS.map((feature) => (
        <FormControlLabel
          key={feature.id}
          control={
            <Checkbox
              checked={privileges.includes(feature.id)}
              onChange={() => onToggle(feature.id)}
              disabled={disabled}
              size="small"
              sx={{ color: "#165d46", "&.Mui-checked": { color: "#165d46" } }}
            />
          }
          label={feature.label}
        />
      ))}
    </FormGroup>
  </div>
);

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
  disabled = false,
  isMobile,
  profileMode = false,
  extendedUserForm = false,
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
    />
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
    {!profileMode && (
      <PrivilegesSection
        privileges={user.privileges || []}
        onToggle={onPrivilegeToggle}
        disabled={disabled}
      />
    )}
  </div>
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
        style={{ fontWeight: 600, color: "#165d46", marginBottom: "0.75em" }}
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
          border: "1px solid #e8efeb",
          boxShadow: "none",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                First Name
              </TableCell>
              <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                Last Name
              </TableCell>
              <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                Email
              </TableCell>
              <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                Role
              </TableCell>
              <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                User ID
              </TableCell>
              <TableCell
                align="center"
                style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9", width: 80 }}
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
                    sx={{ color: "#165d46", "&.Mui-checked": { color: "#165d46" } }}
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
}) => (
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
    {showDiscountRate && (
      <TextField
        size="small"
        label="Discount Rate (%)"
        variant="outlined"
        name="discountrate"
        type="number"
        value={user.discountrate ?? 0}
        onChange={onChange}
        inputProps={{ min: 0, max: 100, step: 1 }}
        helperText="Maximum discount is 100%"
        fullWidth
      />
    )}
  </>
);

const UserManagement = ({ profileMode = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetupFlow = searchParams.get("setup") === "1";
  const isMobile = useMediaQuery("(max-width:600px)");
  const { items: users, status, error } = useSelector((state) => state.users);
  const authUser = useSelector((state) => state.user.user);

  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingUserId, setEditingUserId] = useState(null);
  const [user, setUser] = useState(INITIAL_USER_FORM);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileUserFilter, setProfileUserFilter] = useState("");
  const [selectedReferenceUserId, setSelectedReferenceUserId] = useState(null);
  const [roleFilter, setRoleFilter] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return users.filter((item) => {
      const searchable = [
        item.firstname,
        item.firstName,
        item.lastname,
        item.lastName,
        item.email,
        item.userId,
        item.mobile,
        item.referencenumber,
        item.referenceNumber,
        item.role,
        item.aadharnumber,
        item.pincode,
        item.address,
        item.landmark,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearchTerm || searchable.includes(normalizedSearchTerm);
      const matchesRole = !roleFilter || item.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, status]);

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate profile form when users list loads */
  useEffect(() => {
    if (!profileMode || status === "idle" || status === "loading") return;

    const profileEmail = (authUser?.email || "").trim().toLowerCase();
    if (!profileEmail) return;

    if (status === "succeeded") {
      const matchedUser = users.find(
        (item) => (item.email || "").trim().toLowerCase() === profileEmail
      );

      if (matchedUser) {
        setDialogMode("edit");
        setEditingUserId(matchedUser.id);
        const refUser = findUserByReferenceNumber(
          users,
          matchedUser.referencenumber || matchedUser.referenceNumber || "",
        );
        setSelectedReferenceUserId(refUser?.id || null);
        setUser(mapProfileUserToForm(matchedUser));
        return;
      }
    }

    const nameParts = (authUser?.name || "").trim().split(/\s+/).filter(Boolean);
    setDialogMode("create");
    setEditingUserId(null);
    setUser({
      ...INITIAL_USER_FORM,
      email: authUser?.email || "",
      firstname: nameParts[0] || "",
      lastname: nameParts.slice(1).join(" "),
      role: "Customer",
    });
  }, [profileMode, status, users, authUser]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const profileReady = status === "succeeded" || (profileMode && status === "failed");

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    if (name === "role") {
      setUser((prev) => ({
        ...prev,
        role: value,
        privileges: getDefaultPrivilegeIdsByRole(value),
      }));
      return;
    }
    if (name === "discountrate") {
      if (value === "") {
        setUser((prev) => ({ ...prev, discountrate: "" }));
        return;
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      setUser((prev) => ({
        ...prev,
        discountrate: Math.min(100, Math.max(0, parsed)),
      }));
      return;
    }
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrivilegeToggle = (featureId) => {
    setUser((prev) => {
      const currentPrivileges = prev.privileges || [];
      const nextPrivileges = currentPrivileges.includes(featureId)
        ? currentPrivileges.filter((id) => id !== featureId)
        : [...currentPrivileges, featureId];

      return { ...prev, privileges: nextPrivileges };
    });
  };

  const handleReferenceUserSelect = (selectedUser) => {
    const assignedRole = getAssignedRoleFromReferenceUser(selectedUser);
    setSelectedReferenceUserId(selectedUser.id);
    setUser((prev) => ({
      ...prev,
      referencenumber: mapReferenceNumberFromUserId(selectedUser),
      role: assignedRole,
      privileges: getDefaultPrivilegeIdsByRole(assignedRole),
      discountrate: getDefaultDiscountRateByRole(assignedRole),
    }));
  };

  const sanitizeFileName = (fileName) => {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\s+/g, "_")
      .toLowerCase();
  };

  const getPresignedUrl = async (fileName) => {
    const sanitized = sanitizeFileName(fileName);
    const query = new URLSearchParams({ fileName: sanitized });
    const response = await fetch(`${PRESIGNED_URL_API}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.status}`);
    }
    return response.json();
  };

  const uploadFileToS3 = async (file, presignedUrl) => {
    const fileType = file.type || "image/jpeg";
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": fileType },
    });
    if (!response.ok) {
      throw new Error(`File upload failed with status ${response.status}`);
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxFileSize = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast.error(`File ${file.name} is too large. Max 10MB allowed.`);
        return;
      }
    }

    setUploadingFiles(true);
    const uploadedKeys = [...(user.imageKeys || [])];

    try {
      for (const file of files) {
        toast.info(`Uploading ${file.name}...`);
        const presignedData = await getPresignedUrl(file.name);
        await uploadFileToS3(file, presignedData.url);
        uploadedKeys.push(presignedData.key);
      }

      setUser((prev) => ({
        ...prev,
        imageKeys: uploadedKeys,
      }));

      toast.success(`Successfully uploaded ${files.length} file(s)`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error(`Upload failed: ${err?.message || "Please try again."}`);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setUser((prev) => ({
      ...prev,
      imageKeys: prev.imageKeys.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleClickOpen = () => {
    setDialogMode("create");
    setEditingUserId(null);
    setSelectedReferenceUserId(null);
    setUser(INITIAL_USER_FORM);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setOpen(true);
  };

  const handleOpenEdit = (selectedUser) => {
    setDialogMode("edit");
    setEditingUserId(selectedUser.id);
    const refUser = findUserByReferenceNumber(
      users,
      selectedUser.referencenumber || selectedUser.referenceNumber || "",
    );
    setSelectedReferenceUserId(refUser?.id || null);
    setProfileUserFilter("");
    setUser(mapProfileUserToForm(selectedUser));
    setOpen(true);
  };

  const handleClose = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setOpen(false);
  };

  const handleOpenView = (selectedUser) => {
    setViewingUser(mapUserToForm(selectedUser));
    setViewOpen(true);
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewingUser(null);
  };

  const validateUser = () => {
    if (!user.firstname.trim() || !user.lastname.trim()) {
      toast.error("Please enter first name and last name");
      return false;
    }
    if (!user.email.trim()) {
      toast.error("Please enter email");
      return false;
    }
    if (!user.mobile.trim()) {
      toast.error("Please enter mobile number");
      return false;
    }
    if (!/^\d{10}$/.test(user.mobile.trim())) {
      toast.error("Mobile number must be 10 digits");
      return false;
    }
    if (!user.role) {
      toast.error("Please select a role");
      return false;
    }
    if (!user.aadharnumber.trim()) {
      toast.error("Please enter Aadhar number");
      return false;
    }
    if (!/^\d{12}$/.test(user.aadharnumber.trim())) {
      toast.error("Aadhar number must be 12 digits");
      return false;
    }
    if (!user.pincode.trim()) {
      toast.error("Please enter pincode");
      return false;
    }
    if (!/^\d{6}$/.test(user.pincode.trim())) {
      toast.error("Pincode must be 6 digits");
      return false;
    }
    if (!user.address.trim()) {
      toast.error("Please enter address");
      return false;
    }
    if (dialogMode === "edit" && !profileMode) {
      const discountRate = Number(user.discountrate);
      if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100) {
        toast.error("Discount rate must be between 0 and 100");
        return false;
      }
    }
    return true;
  };

  const handleSaveUser = async () => {
    if (!validateUser()) return;

    try {
      const isEditMode = dialogMode === "edit" && editingUserId !== null;

      const payload = {
        firstname: user.firstname.trim(),
        lastname: user.lastname.trim(),
        email: user.email.trim(),
        mobile: user.mobile.trim(),
        referencenumber: user.referencenumber.trim(),
        role: user.role,
        aadharnumber: user.aadharnumber.trim(),
        address: user.address.trim(),
        landmark: user.landmark.trim(),
        pincode: user.pincode.trim(),
        imageKeys: user.imageKeys || [],
        images: user.imageKeys || [],
      };

      if (profileMode) {
        const resolvedPrivileges =
          user.privileges?.length > 0
            ? user.privileges
            : getDefaultPrivilegeIdsByRole(user.role);
        payload.privileges = resolvedPrivileges;
        payload.privilages = resolvedPrivileges;
      } else {
        payload.privileges = user.privileges || [];
        payload.privilages = user.privileges || [];
      }

      if (isEditMode && !profileMode) {
        payload.discountrate = Math.min(100, Math.max(0, Number(user.discountrate) || 0));
      }

      if (isEditMode) {
        await updateUser(editingUserId, payload);
      } else {
        await createUser(payload);
      }
      toast.success(isEditMode ? "User updated successfully" : "User added successfully");
      dispatch(fetchUsers());
      if (!profileMode) {
        setEditingUserId(null);
        setUser(INITIAL_USER_FORM);
        handleClose();
      } else if (!isEditMode) {
        setDialogMode("edit");
      }

      if (profileMode && isSetupFlow) {
        const role = getUserRoleFromList(users, authUser?.email);
        navigate(getDashboardHomePath(role, user.privileges || []));
      }
    } catch (err) {
      toast.error(err?.message || "Unable to save user");
    }
  };

  const handleSkipProfile = () => {
    if (authUser?.id) {
      markProfileSetupSkipped(authUser.id);
    }
    navigate("/");
  };

  if (profileMode) {
    return (
      <>
        <ToastContainer
          position={isMobile ? "top-center" : "top-right"}
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="colored"
        />
        <Card
          style={{
            height: "100%",
            width: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e8efeb",
          }}
        >
          <CardContent style={{ padding: isMobile ? "8px 12px" : "16px" }}>
            <Typography variant="h6" style={{ fontWeight: 700, color: "#165d46", marginBottom: "0.5em" }}>
              {isSetupFlow ? "Complete Your Profile" : "Edit Profile"}
            </Typography>
            <Typography variant="body2" color="text.secondary" style={{ marginBottom: "1em" }}>
              {isSetupFlow
                ? "We saved your Google name and email. Add the remaining details now or skip and complete later."
                : "Update your account details."}
            </Typography>

            {status === "loading" && <Typography style={{ marginTop: "1em" }}>Loading profile...</Typography>}
            {status === "failed" && (
              <Typography color="warning.main" style={{ marginTop: "1em" }}>
                {profileMode
                  ? "Could not load your saved profile. You can still update your details below."
                  : error}
              </Typography>
            )}

            {profileReady && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1em",
                  maxWidth: "100%",
                  width: "100%",
                }}
              >
                <UserFormFields
                  user={user}
                  onChange={handleOnChange}
                  onPrivilegeToggle={handlePrivilegeToggle}
                  isMobile={isMobile}
                  profileMode={profileMode}
                  extendedUserForm
                />
                <ReferenceNumberFields
                  user={user}
                  users={users}
                  filter={profileUserFilter}
                  onFilterChange={setProfileUserFilter}
                  selectedReferenceUserId={selectedReferenceUserId}
                  onSelectUser={handleReferenceUserSelect}
                  onChange={handleOnChange}
                />
                <ImageUploadSection
                  imageKeys={user.imageKeys || []}
                  fileInputRef={fileInputRef}
                  uploadingFiles={uploadingFiles}
                  onFileUpload={handleFileUpload}
                  onRemoveFile={handleRemoveFile}
                />
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Button
                    onClick={handleSaveUser}
                    disabled={uploadingFiles}
                    variant="contained"
                    style={{
                      backgroundColor: "#165d46",
                      textTransform: "none",
                      fontWeight: "bolder",
                    }}
                  >
                    Save Profile
                  </Button>
                  {isSetupFlow && (
                    <Button
                      onClick={handleSkipProfile}
                      disabled={uploadingFiles}
                      variant="outlined"
                      style={{
                        textTransform: "none",
                        fontWeight: "bolder",
                        borderColor: "#165d46",
                        color: "#165d46",
                      }}
                    >
                      Skip for now
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <ToastContainer
        position={isMobile ? "top-center" : "top-right"}
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <Card
        style={{
          height: "100%",
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e8efeb",
        }}
      >
        <CardContent style={{ padding: isMobile ? "8px 12px" : "16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: "1em",
            }}
          >
            
            <IconButton
              onClick={handleClickOpen}
              size="small"
              aria-label="Add user"
              style={{ color: "#165d46" }}
            >
              <MdPersonAdd size={50} style={{ fontSize: "20px" }} />
            </IconButton> 
          </div>

          <div
            style={{
              marginTop: 0,
              backgroundColor: "#fafbf9",
              padding: 0,
              borderRadius: "8px",
            }}
          >
            <CategoryCarousel
              items={USER_ROLES}
              selectedCategory={roleFilter}
              onCategorySelect={setRoleFilter}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: isMobile ? "0.25em" : "1em",
              flexWrap: "wrap",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                border: "1px solid #e8efeb",
                boxShadow: "none",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      First Name
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      Last Name
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      User ID
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      Email
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      Mobile
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      Role
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      Pincode
                    </TableCell>                    
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      Reference Number
                    </TableCell>
                    <TableCell
                      align="right"
                      style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9", minWidth: 120 }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.firstname || item.firstName || "—"}</TableCell>
                      <TableCell>{item.lastname || item.lastName || "—"}</TableCell>
                      <TableCell>{getUserId(item)}</TableCell>
                      <TableCell>{item.email || "—"}</TableCell>
                      <TableCell>{item.mobile || "—"}</TableCell>
                      <TableCell>{item.role || "—"}</TableCell>
                      <TableCell>{item.pincode || "—"}</TableCell>
                      <TableCell>{item.referencenumber || "—"}</TableCell>
                      <TableCell align="right" style={{ whiteSpace: "nowrap" }}>
                        <IconButton
                          onClick={() => handleOpenView(item)}
                          size="small"
                          aria-label="View user"
                          style={{ color: "#165d46" }}
                        >
                          <MdVisibility size={20} />
                        </IconButton>
                        <IconButton
                          onClick={() => handleOpenEdit(item)}
                          size="small"
                          aria-label="Edit user"
                          style={{ color: "#165d46" }}
                        >
                          <MdEdit size={20} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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

      <Dialog open={open} onClose={handleClose} scroll="paper" maxWidth={dialogMode === "edit" ? "lg" : "md"} fullWidth={dialogMode === "edit"}>
        <DialogTitle>{dialogMode === "edit" ? "Update User" : "Add User"}</DialogTitle>
        <DialogContent dividers>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1em",
              width: "100%",
              maxWidth: dialogMode === "edit" ? "100%" : isMobile ? "100%" : "720px",
            }}
          >
            <UserFormFields
              user={user}
              onChange={handleOnChange}
              onPrivilegeToggle={handlePrivilegeToggle}
              isMobile={isMobile}
              profileMode={false}
              extendedUserForm={dialogMode === "edit"}
            />
            {dialogMode === "edit" && (
              <ReferenceNumberFields
                user={user}
                users={users}
                filter={profileUserFilter}
                onFilterChange={setProfileUserFilter}
                selectedReferenceUserId={selectedReferenceUserId}
                onSelectUser={handleReferenceUserSelect}
                onChange={handleOnChange}
                showDiscountRate
              />
            )}
            <ImageUploadSection
              imageKeys={user.imageKeys || []}
              fileInputRef={fileInputRef}
              uploadingFiles={uploadingFiles}
              onFileUpload={handleFileUpload}
              onRemoveFile={handleRemoveFile}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveUser} disabled={uploadingFiles}>
            {dialogMode === "edit" ? "Update user" : "Add user"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={handleCloseView} scroll="paper">
        <DialogTitle>View User</DialogTitle>
        <DialogContent dividers>
          {viewingUser && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1em",
                width: isMobile ? "100%" : "720px",
                maxWidth: "100%",
              }}
            >
              <UserFormFields
                user={viewingUser}
                onChange={() => {}}
                onPrivilegeToggle={() => {}}
                disabled
                isMobile={isMobile}
                profileMode={false}
              />
              <TextField
                size="small"
                label="Discount Rate (%)"
                variant="outlined"
                value={viewingUser.discountrate ?? 0}
                disabled
                fullWidth
              />
              <ImageUploadSection
                imageKeys={viewingUser.imageKeys || []}
                disabled
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserManagement;
