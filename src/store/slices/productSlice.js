import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

const initialState = {
	items: [],
	status: 'idle',
	error: null,
	page: 1,
	pageSize: 16,
}

export const fetchProducts = createAsyncThunk(
	'products/fetchProducts',
	async (_, thunkAPI) => {
		try {
			const response = await fetch('https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/products')

			if (!response.ok) {
				throw new Error('Failed to fetch products')
			}

			return await response.json()
		} catch (error) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

export const productSlice = createSlice({
	name: 'products',
	initialState,
	reducers: {
		setPage: (state, action) => {
			state.page = action.payload
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProducts.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchProducts.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.items = action.payload
				state.page = 1
			})
			.addCase(fetchProducts.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload || 'Something went wrong'
			})
	},
})

export const { setPage } = productSlice.actions

export default productSlice.reducer