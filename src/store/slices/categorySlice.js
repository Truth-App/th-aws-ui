import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { CATEGORY_API_URL } from '../../constants/api'

const initialState = {
	items: [],
	status: 'idle',
	error: null,
}

export const fetchCategories = createAsyncThunk(
	'categories/fetchCategories',
	async (_, thunkAPI) => {
		try {
			const response = await fetch(CATEGORY_API_URL)

			if (!response.ok) {
				throw new Error(`Failed to fetch categories (${response.status})`)
			}

			const contentType = response.headers.get('content-type') || ''
			if (!contentType.includes('application/json')) {
				throw new Error('Invalid response from category API. Check dev proxy or API URL.')
			}

			return await response.json()
		} catch (error) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

export const categorySlice = createSlice({
	name: 'categories',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCategories.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchCategories.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.items = action.payload
			})
			.addCase(fetchCategories.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload || 'Something went wrong'
			})
	},
})

export default categorySlice.reducer
