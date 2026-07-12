import AdminPageLayout from "../components/AdminPageLayout";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useEffect, useMemo, useState } from "react";
import { getStocks } from "../api/stocks";
import { S3_BASE_URL } from "../constants/api";

const formatInr = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return "INR 0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalized);
};

const getStocksArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.stocks)) return response.stocks;
  if (Array.isArray(response?.data)) return response.data;
  if (response && typeof response === "object" && response.inventoryId) return [response];
  return [];
};

const getImageSrc = (imageKeys) => {
  if (!Array.isArray(imageKeys) || !imageKeys.length) return "/thriftyhomelogo.png";
  return `${S3_BASE_URL}/${imageKeys[0]}`;
};

const MyStocks = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    let ignore = false;

    const loadStocks = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getStocks();
        const nextStocks = getStocksArray(response);

        if (!ignore) {
          setStocks(nextStocks);
        }
      } catch (fetchError) {
        if (!ignore) {
          setStocks([]);
          setError(fetchError?.message || "Failed to fetch stocks.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadStocks();

    return () => {
      ignore = true;
    };
  }, []);

  const rows = useMemo(
    () =>
      stocks.map((item, index) => ({
        id: String(item?.inventoryId || item?.id || index + 1),
        inventoryId: item?.inventoryId || item?.id || "-",
        userId: item?.userId || "-",
        productTitle: item?.productTitle || "-",
        category: item?.category || "-",
        stockQuantity: Number(item?.stockQuantity ?? item?.stockquantity ?? item?.quantity ?? 0),
        orderedQuantity: Number(item?.orderedQuantity ?? 0),
        availableQuantity: Number(
          item?.availableQuantity ??
            Number(item?.stockQuantity ?? item?.stockquantity ?? 0) - Number(item?.orderedQuantity ?? 0),
        ),
        mrpPrice: formatInr(item?.mrpPrice ?? 0),
        price: formatInr(item?.price ?? 0),
        imageSrc: getImageSrc(item?.imageKeys),
      })),
    [stocks],
  );

  return (
    <AdminPageLayout activeFeature="my-stocks">
      <Card
        style={{
          width: "100%",
          height: "100%",
          overflowY: "auto",
          border: "1px solid #e8efeb",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <CardContent>
          <Typography variant="h6" style={{ fontWeight: 700, color: "#165d46" }}>
            My Stocks
          </Typography>

          {loading && (
            <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
              <CircularProgress size={20} style={{ color: "#165d46" }} />
              <Typography variant="body2" color="text.secondary">
                Loading stocks...
              </Typography>
            </div>
          )}

          {!!error && (
            <Alert severity="error" style={{ marginTop: "16px" }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <TableContainer component={Paper} style={{ marginTop: "16px", border: "1px solid #e8efeb", boxShadow: "none" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: 700 }}>Image</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Product</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Stock Quantity</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Ordered Quantity</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Available Quantity</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>MRP</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Inventory ID</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>User ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} style={{ textAlign: "center", color: "#6f7378" }}>
                        No stocks found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <img
                            src={row.imageSrc}
                            alt={row.productTitle}
                            style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "6px", backgroundColor: "#f5f5f5" }}
                          />
                        </TableCell>
                        <TableCell>{row.productTitle}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.stockQuantity}</TableCell>
                        <TableCell>{row.orderedQuantity}</TableCell>
                        <TableCell>{row.availableQuantity}</TableCell>
                        <TableCell>{row.mrpPrice}</TableCell>
                        <TableCell style={{ fontWeight: 600, color: "#165d46" }}>{row.price}</TableCell>
                        <TableCell>{row.inventoryId}</TableCell>
                        <TableCell>{row.userId}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default MyStocks;
