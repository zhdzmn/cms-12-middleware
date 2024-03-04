import axios from 'axios';

function ensureLocalAPIURL(url) {
  return url;
}

export async function getToken(clientId, clientSecret) {
  const tokenData = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials'
  };
  const tokenRequest = await axios.post(
    `${process.env.SSO_DOMAIN}/o/oauth2/v1/token`,
    tokenData,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return tokenRequest.data.access_token;
};

export async function postPublicAPI(token, url, data) {
  const previewApiResponse = await axios.post(
    ensureLocalAPIURL(url),
    data,
    {
      headers: {
        'authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return previewApiResponse.data;
};

export async function getAssetURL(token, link) {
  const previewApiResponse = await axios.get(
    ensureLocalAPIURL(link),
    {
      headers: {
        'authorization': `Bearer ${token}`
      }
    }
  );
  return previewApiResponse.data.url;
};
