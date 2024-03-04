import { getAssetURL } from "../cmp.js";

function mergeTokenData(listResults) {
  let returnVal = {};
  listResults.filter(Boolean).forEach(result => {
    returnVal = {
      ...returnVal,
      ...result
    };
  });
  return returnVal;
}

export async function prepareCMSData(fieldValues, valueMapping, apiToken) {
  if (!fieldValues) { return; }
  const results = await Promise.all(Object.entries(valueMapping).map(
    async ([attr, attrSchema]) => {
      if (attrSchema.behaviour === 'List') {
        const listResults = await Promise.all(attrSchema.elements.map((_attrSchema, index) => {
          return prepareCMSData(
            fieldValues,
            {[attr]: {..._attrSchema, _type: attrSchema._type, valIndex: index}},
            apiToken
          );
        }));
        return mergeTokenData(listResults);
      }
      const activeFieldValue = fieldValues[attr]?.[0].field_values?.[attrSchema.valIndex ?? 0];
      if (attrSchema._type === 'Component') {
        const listResults = await Promise.all(Object.entries(attrSchema.map).map(([_attr, _attrSchema]) => {
          return prepareCMSData(
            activeFieldValue?.content_details.latest_fields_version?.fields,
            {[_attr]: _attrSchema},
            apiToken
          );
        }));
        return mergeTokenData(listResults);
      }
      if (attrSchema._type === 'TextField') {
        return {
          [attrSchema.cmsAttr]: {value: activeFieldValue?.text_value ?? ''}
        };
      }
      if (attrSchema._type === 'RichTextField') {
        return {
          [attrSchema.cmsAttr]: {value: activeFieldValue?.rich_text_value ?? ''}
        };
      }
      if (attrSchema._type === 'URLField') {
        return {
          [attrSchema.cmsAttr]: {value: activeFieldValue?.url ?? undefined}
        };
      }
      if (attrSchema._type === 'ChoiceField') {
        return {
          [attrSchema.cmsAttr]: {value: activeFieldValue?.choice_key ?? undefined}
        };
      }
      if (attrSchema._type === 'AssetField') {
        if (activeFieldValue) {
          const url = await getAssetURL(apiToken, activeFieldValue.links.self);
          return {
            [attrSchema.cmsAttr]: {value: url}
          };
        }
      }
      return;
    }));
  return mergeTokenData(results);
}
