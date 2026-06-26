import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';

/**
 * Fetches the currently authenticated Cognito user.
 * Reads user info (email, name, picture) from the ID token payload already
 * cached in memory — avoids a separate fetchUserAttributes() network call to
 * Cognito that can 400 when the access token is stale.
 */
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const { userId } = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.payload ?? {};
      // Cognito URL-encodes the picture URL from Google — decode it before storing
      const rawPicture = idToken.picture ?? null;
      return {
        id: userId,
        email: idToken.email ?? null,
        name: idToken.name ?? idToken.email ?? null,
        picture: rawPicture ? decodeURIComponent(rawPicture) : null,
      };
    } catch (error) {
      // UserUnAuthenticatedException / NotAuthorizedException = no active session
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Signs the user out via Cognito and clears Redux state.
 */
export const logoutUser = createAsyncThunk(
  'user/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await signOut();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  /** @type {{ id: string, email: string, name: string, picture: string|null } | null} */
  user: null,
  isAuthenticated: false,
  /** @type {'idle'|'loading'|'succeeded'|'failed'} */
  status: 'idle',
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /** Manually clears user state (e.g. after signOut side-effect). */
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchCurrentUser ---
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload ?? 'Failed to fetch user';
      })
      // --- logoutUser ---
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to sign out';
      });
  },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;
