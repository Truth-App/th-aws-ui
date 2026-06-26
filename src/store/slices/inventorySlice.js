import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { INVENTORY_API_URL } from '../../constants/api'

const initialState = {
	items: [],
	status: 'idle',
	error: null,
}

export const fetchInventory = createAsyncThunk(
	'inventory/fetchInventory',
	async (_, thunkAPI) => {
		try {
			const response = await fetch(INVENTORY_API_URL)

			if (!response.ok) {
				throw new Error(`Failed to fetch inventory (${response.status})`)
			}

			const contentType = response.headers.get('content-type') || ''
			if (!contentType.includes('application/json')) {
				throw new Error('Invalid response from inventory API. Check dev proxy or API URL.')
			}

			return await response.json()
		} catch (error) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

export const inventorySlice = createSlice({
	name: 'inventory',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchInventory.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchInventory.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.items = action.payload
			})
			.addCase(fetchInventory.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload || 'Something went wrong'
			})
	},
})

export default inventorySlice.reducer
