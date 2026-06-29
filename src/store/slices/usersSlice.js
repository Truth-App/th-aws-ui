import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getUsers } from '../../api/users'

const initialState = {
	items: [],
	status: 'idle',
	error: null,
}

export const fetchUsers = createAsyncThunk(
	'users/fetchUsers',
	async (_, thunkAPI) => {
		try {
			return await getUsers()
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
