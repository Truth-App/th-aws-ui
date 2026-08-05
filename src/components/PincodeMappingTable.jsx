import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MdAdd, MdDelete, MdEdit, MdExpandMore } from "react-icons/md";
import { PINCODE_API_URL, PINCODE_UPSERT_API_URL } from "../constants/api";

const normalizeRows = (payload) => {
  const rows = Array.isArray(payload?.result) ? payload.result : [];
  return rows
    .map((row) => ({
      city: String(row?.city || "").trim(),
      pincode: String(row?.pincode || "").trim(),
      createdAt: row?.createdAt || null,
    }))
    .filter((row) => row.city || row.pincode);
};

const groupByCity = (rows) => {
  const grouped = {};
  rows.forEach((row) => {
    const city = row.city || "Unknown";
    if (!grouped[city]) {
      grouped[city] = [];
    }
    grouped[city].push(row);
  });
  return grouped;
};

const readErrorMessage = async (response, fallbackMessage) => {
  try {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
  } catch {
    // Ignore parse errors and keep fallback
  }
  return `${fallbackMessage} (Status: ${response.status})`;
};

const validatePincodeForm = ({ city, pincode }) => {
  if (!String(city || "").trim()) {
    return "City is required.";
  }
  if (!/^\d{6}$/.test(String(pincode || "").trim())) {
    return "Pincode must be exactly 6 digits.";
  }
  return "";
};

const PincodeMappingTable = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedRow, setSelectedRow] = useState(null);
  const [formValues, setFormValues] = useState({ city: "", pincode: "" });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadPincodeMapping = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(PINCODE_API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to load pincode mapping. Status: ${response.status}`);
      }

      const data = await response.json();
      setRows(normalizeRows(data));
    } catch (err) {
      setRows([]);
      setError(err?.message || "Failed to load pincode mapping.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadPincodeMapping();
    };

    run();
  }, [loadPincodeMapping]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return rows;

    return rows.filter((row) => {
      const searchable = `${row.pincode} ${row.city}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [rows, searchTerm]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) =>
      a.pincode.localeCompare(b.pincode, undefined, { numeric: true }),
    );
  }, [filteredRows]);

  const groupedByCity = useMemo(() => {
    return groupByCity(sortedRows);
  }, [sortedRows]);

  const sortedCities = useMemo(() => {
    return Object.keys(groupedByCity).sort();
  }, [groupedByCity]);

  const openCreateDialog = () => {
    setFormMode("create");
    setSelectedRow(null);
    setFormValues({ city: "", pincode: "" });
    setActionError("");
    setActionSuccess("");
    setFormOpen(true);
  };

  const openEditDialog = (row) => {
    setFormMode("edit");
    setSelectedRow(row);
    setFormValues({ city: row.city || "", pincode: row.pincode || "" });
    setActionError("");
    setActionSuccess("");
    setFormOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setFormOpen(false);
    setSelectedRow(null);
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Delete mapping for pincode ${row.pincode} (${row.city || "-"})?`,
    );
    if (!confirmed) return;

    setActionError("");
    setActionSuccess("");

    try {
      const deleteResponse = await fetch(
        `${PINCODE_UPSERT_API_URL}/${encodeURIComponent(row.pincode)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!deleteResponse.ok) {
        throw new Error(
          await readErrorMessage(deleteResponse, "Failed to delete pincode mapping."),
        );
      }

      setActionSuccess("Pincode mapping deleted.");
      await loadPincodeMapping();
    } catch (err) {
      setActionError(err?.message || "Failed to delete pincode mapping.");
    }
  };

  const handleSubmit = async () => {
    const payload = {
      city: String(formValues.city || "").trim(),
      pincode: String(formValues.pincode || "").trim(),
    };

    const validationError = validatePincodeForm(payload);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    setSaving(true);
    setActionError("");
    setActionSuccess("");

    try {
      const isEdit = formMode === "edit";
      const response = await fetch(PINCODE_UPSERT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            isEdit ? "Failed to update pincode mapping." : "Failed to create pincode mapping.",
          ),
        );
      }

      setActionSuccess(isEdit ? "Pincode mapping updated." : "Pincode mapping created.");
      setFormOpen(false);
      await loadPincodeMapping();
    } catch (err) {
      setActionError(err?.message || "Failed to save pincode mapping.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      style={{
        width: "100%",
        height: "100%",
        overflowY: "visible",
        border: "none",
        boxShadow: "none",
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent style={{ padding: isMobile ? "12px" : "16px" }}>
        <Typography variant="h6" style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: "0.25em" }}>
          Pincode Mapping
        </Typography>
   

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "12px",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
          }}
        >
          <TextField
            size="small"
            label="Search city or pincode"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ minWidth: isMobile ? "100%" : 320 }}
          />
          <Button
            variant="contained"
            onClick={openCreateDialog}
            startIcon={<MdAdd />}
            style={{
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: "var(--brand-primary)",
            }}
          >
            Create Pincode
          </Button>
        </div>

        {!!actionSuccess && (
          <Alert severity="success" style={{ marginTop: "12px" }}>
            {actionSuccess}
          </Alert>
        )}

        {!!actionError && (
          <Alert severity="error" style={{ marginTop: "12px" }}>
            {actionError}
          </Alert>
        )}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
            <CircularProgress size={20} style={{ color: "var(--brand-primary-strong)" }} />
            <Typography variant="body2" color="text.secondary">
              Loading pincode mapping...
            </Typography>
          </div>
        )}

        {!!error && (
          <Alert severity="error" style={{ marginTop: "12px" }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <div style={{ marginTop: "16px" }}>
            {sortedCities.length === 0 ? (
              <Typography
                variant="body2"
                style={{
                  textAlign: "center",
                  color: "#6f7378",
                  padding: "24px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                No pincode mapping records found.
              </Typography>
            ) : (
              sortedCities.map((city) => (
                <Accordion
                  key={city}
                  defaultExpanded={sortedCities.length <= 3}
                  style={{
                    marginBottom: "8px",
                    border: "1px solid var(--brand-border)",
                    boxShadow: "none",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<MdExpandMore size={24} />}
                    style={{
                      backgroundColor: "#f9f9f9",
                      borderBottom: "1px solid var(--brand-border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", flex: 1 }}>
                      <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                        {city}
                      </Typography>
                      <Typography
                        variant="body2"
                        style={{ color: "#6f7378", fontWeight: 500 }}
                      >
                        ({groupedByCity[city].length} pincode{groupedByCity[city].length !== 1 ? "s" : ""})
                      </Typography>
                      {groupedByCity[city].map((row) => (
                        <Chip
                          key={row.pincode}
                          label={row.pincode}
                          size="small"
                          style={{
                            backgroundColor: "var(--brand-tint)",
                            color: "var(--brand-primary-strong)",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        />
                      ))}
                    </div>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0, borderLeft: "4px solid var(--brand-primary)" }}>
                    <TableContainer component={Paper} variant="outlined" style={{ width: "100%", borderColor: "transparent", boxShadow: "none", backgroundColor: "#f0f7ff" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: "#f9f9f9" }}>
                            {!isMobile && <TableCell style={{ fontWeight: 700, width: 60 }}>Sno</TableCell>}
                            <TableCell style={{ fontWeight: 700 }}>Pincode</TableCell>
                            {!isMobile && <TableCell style={{ fontWeight: 700 }}>Created At</TableCell>}
                            <TableCell style={{ fontWeight: 700, width: isMobile ? 80 : 120, textAlign: "center" }}>
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupedByCity[city].map((row, index) => (
                            <TableRow key={`${row.city}-${row.pincode}-${index}`}>
                              {!isMobile && <TableCell>{index + 1}</TableCell>}
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  style={{ fontWeight: 600, color: "var(--brand-primary-strong)" }}
                                >
                                  {row.pincode || "-"}
                                </Typography>
                              </TableCell>
                              {!isMobile && (
                                <TableCell>
                                  <Typography variant="body2">
                                    {row.createdAt
                                      ? new Date(row.createdAt).toLocaleDateString()
                                      : "-"}
                                  </Typography>
                                </TableCell>
                              )}
                              <TableCell style={{ textAlign: "center" }}>
                                <IconButton
                                  aria-label="edit pincode mapping"
                                  size="small"
                                  onClick={() => openEditDialog(row)}
                                  style={{ color: "var(--brand-primary-strong)" }}
                                  title="Edit"
                                >
                                  <MdEdit />
                                </IconButton>
                                <IconButton
                                  aria-label="delete pincode mapping"
                                  size="small"
                                  onClick={() => handleDelete(row)}
                                  style={{ color: "#b42318" }}
                                  title="Delete"
                                >
                                  <MdDelete />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </div>
        )}

        <Dialog open={formOpen} onClose={closeDialog} fullWidth maxWidth="xs">
          <DialogTitle>
            {formMode === "edit" ? "Edit Pincode Mapping" : "Create Pincode Mapping"}
          </DialogTitle>
          <DialogContent style={{ display: "grid", gap: "12px", paddingTop: "8px" }}>
            <TextField
              size="small"
              label="Pincode"
              value={formValues.pincode}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  pincode: event.target.value.replace(/\D/g, "").slice(0, 6),
                }))
              }
              inputProps={{ maxLength: 6 }}
            />
            <TextField
              size="small"
              label="City"
              value={formValues.city}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  city: event.target.value,
                }))
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog} disabled={saving} style={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              variant="contained"
              style={{ textTransform: "none", fontWeight: 700, backgroundColor: "var(--brand-primary)" }}
            >
              {saving ? "Saving..." : formMode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PincodeMappingTable;
