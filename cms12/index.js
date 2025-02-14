import { v4 as uuidv4 } from 'uuid';
import { appLogger } from '../logger.js';
import { getToken, postPublicAPI } from '../cmp.js';
import { prepareCMSData } from './tokenMapper.js';
import CMS12 from './cli.js';
import Accessify from '../accessify/index.js';

export async function publish(req, res) {
  const payload = req.body;
  const structuredContent = payload.data.assets?.structured_contents[0];
  const fieldsWithLocal = structuredContent.content_body.latest_fields_version.fields ?? {};
  appLogger.info('publishing content');
  const contentTypeName = structuredContent?.content_body.content_type.name ?? '';

  // get app token for open api calls
  const token = await getToken(process.env.APP_CLIENT_ID, process.env.APP_CLIENT_SECRET);
  appLogger.info('generated Token');
  const accessify = new Accessify(token);
  const contentTypeMapping = await accessify.getContentTypeMapping();

  if (!contentTypeMapping.hasOwnProperty(contentTypeName)) {
    appLogger.error({
      contentTypeName,
      availableTypes: Object.keys(contentTypeMapping)
    }, 'rejecting publishing for non supported content type');
    return res.status(200).json({message: 'not publishing since the contentType did not match'});
  }

  const structuredContentId = structuredContent.id;
  const contentType = contentTypeMapping[contentTypeName];

  const cmsContent = await createCMSContent(
    token,
    fieldsWithLocal,
    contentType,
    structuredContent?.content_body.title,
    true
  );

  await postPublicAPI(token, payload.data.publishing_event.links.publishing_metadata, {
    data: [{
      status: 'published',
      status_message: 'Successfully published to CMS12',
      publishing_destination_updated_at: (new Date()).toISOString(),
      public_url: cmsContent.url,
      asset_id: structuredContentId,
      locale: 'en'
    }],
  });

  appLogger.info('publishing completed');
  return res.status(200).json({success: true});
};

export async function generatePreview(req, res) {
  const payload = req.body;
  const structuredContent = payload.data.assets?.structured_contents[0];
  const fieldsWithLocal = structuredContent?.content_body.fields_version.fields ?? {};
  appLogger.info('Generating preview');
  const contentTypeName = structuredContent?.content_body.content_type.name ?? '';

  // get app token for open api calls
  const token = await getToken(process.env.APP_CLIENT_ID, process.env.APP_CLIENT_SECRET);
  appLogger.info('generated Token');
  const accessify = new Accessify(token);
  const contentTypeMapping = await accessify.getContentTypeMapping();

  if (!contentTypeMapping.hasOwnProperty(contentTypeName)) {
    appLogger.error({
      contentTypeName,
      availableTypes: Object.keys(contentTypeMapping)
    }, 'rejecting preview for non supported content type');
    return res.status(200).json({
      message: 'not generating the preview since the contentType did not match'
    });
  }
  const contentType = contentTypeMapping[contentTypeName];

  // acknowledge the preview request
  await postPublicAPI(token, payload.data.links.acknowledge, {
    acknowledged_by: "cms-12-middleware",
    content_hash: structuredContent?.content_body.fields_version.content_hash,
  });
  appLogger.info('preview acknowledged');

  const cmsContent = await createCMSContent(
    token,
    fieldsWithLocal,
    contentType,
    structuredContent?.content_body.title
  );

  // send complete api call to the openapi
  await postPublicAPI(token, payload.data.links.complete, {
    keyedPreviews: {
      [`${cmsContent.routeSegment}-${cmsContent.key}`]: cmsContent.url
    },
  });

  appLogger.info('Preview completed');
  return res.status(200).json({success: true});
};

async function createCMSContent(token, fieldsWithLocal, contentType, title, publishToMainFolder) {
  // initialize cms12 cli
  const cms12 = new CMS12(
    process.env.CMS_URL,
    process.env.CMS12_CLIENT_ID,
    process.env.CMS12_CLIENT_SECRET,
  );

  try {
    await cms12.initialize();
  } catch (err) {
    appLogger.info({err}, 'There is an ERROR !!!!');
    throw err;
  }

  appLogger.info({
    url: process.env.CMS_URL
  }, 'cms12 cli initiated');

  // prepare cms12 data
  const properties = await prepareCMSData(fieldsWithLocal, contentType.mapping, token, cms12);
  properties.categories = contentType.categories.map(category => `cms://content/${category}`);
  const cmsData = {
    properties,
    container: (publishToMainFolder ? contentType.publishContainer : contentType.previewContainer) || contentType.container,
    displayName: properties.metaTitle || title || 'Untitled',
    status: 'published',
    locale: 'en',
    contentType: contentType.contentType,
    key: uuidv4().split('-').join(''),
  };
  appLogger.debug('CMS data prepared');

  const cmsContent = await cms12.createContent(cmsData);
  appLogger.debug(cmsContent, 'CMS content');

  if (!publishToMainFolder) {
    setTimeout(async () => {
      cms12.deleteContent(cmsContent.key).then(() => {
        appLogger.info('removed preview completed');
      }).catch(err => appLogger.error({err}, 'failed to remove the post'));
    }, process.env.PREVIEW_ALIVE_TIMEOUT * 1000);
  }

  return cmsContent;
}
