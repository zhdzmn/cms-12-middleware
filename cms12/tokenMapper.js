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

export async function prepareCMSData(fieldValues, valueMapping, token) {
  if (!fieldValues) { return; }
  const results = await Promise.all(Object.entries(valueMapping).map(
    async ([attr, attrSchema]) => {
      const activeIndex = attrSchema.valIndex ?? 0;
      if (attrSchema._type === 'List') {
        const listResults = await Promise.all(attrSchema.maps.map((vMapping, index) => {
          return prepareCMSData(
            fieldValues,
            {[attr]: {...vMapping, valIndex: index}},
            token
          );
        }));
        return mergeTokenData(listResults);
      }
      if (attrSchema._type === 'Component') {
        const listResults = await Promise.all(Object.entries(attrSchema.map).map(([cms12FieldName, fieldConfig]) => {
          return prepareCMSData(
            fieldValues[attr]?.[0].field_values?.[activeIndex]?.content_details.latest_fields_version?.fields,
            {[cms12FieldName]: fieldConfig},
            token
          );
        }));
        return mergeTokenData(listResults);
      }
      if (attrSchema._type === 'TextField') {
        return {
          [attr]: {value: fieldValues[attrSchema.attr]?.[0].field_values?.[activeIndex]?.text_value ?? ''}
        };
      }
      if (attrSchema._type === 'RichTextField') {
        return {
          [attr]: {
            value: fieldValues[attrSchema.attr]?.[0].field_values?.[activeIndex]?.rich_text_value ?? ''
          }
        };
      }
      if (attrSchema._type === 'URLField') {
        return {
          [attr]: {value: fieldValues[attrSchema.attr]?.[0].field_values?.[activeIndex]?.url ?? undefined}
        };
      }
      if (attrSchema._type === 'ChoiceField') {
        return {
          [attr]: {value: fieldValues[attrSchema.attr]?.[0].field_values?.[activeIndex]?.choice_key ?? undefined}
        };
      }
      if (attrSchema._type === 'AssetField') {
        const asset = fieldValues[attrSchema.attr]?.[0].field_values?.[activeIndex];
        if (asset) {
          const url = await getAssetURL(token, asset.links.self);
          return {
            [attr]: {value: url}
          };
        }
      }
      return;
    }));
  return mergeTokenData(results);
}
