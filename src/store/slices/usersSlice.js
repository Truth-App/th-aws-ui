import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { USER_API_URL } from '../../constants/api'

const initialState = {
	items: [],
	status: 'idle',
	error: null,
}

export const fetchUsers = createAsyncThunk(
	'users/fetchUsers',
	async (_, thunkAPI) => {
		try {
			const response = await fetch(USER_API_URL)

			if (!response.ok) {
				throw new Error(`Failed to fetch users (${response.status})`)
			}

			const contentType = response.headers.get('content-type') || ''
			if (!contentType.includes('application/json')) {
				throw new Error('Invalid response from users API. Check dev proxy or API URL.')
			}

			return await response.json()
		} catch (error) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

export const usersSlice = createSlice({
	name: 'users',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUsers.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchUsers.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.items = action.payload
			})
			.addCase(fetchUsers.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload || 'Something went wrong'
			})
	},
})

export default usersSlice.reducer
