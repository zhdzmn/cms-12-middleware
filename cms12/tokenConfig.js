export const defaultMapping = {
  'Opti Marketing Blog Post': {
    'mapping': {
      'heading': { '_type': 'TextField', 'cmsAttr': 'heading' },
      'mainBody': { '_type': 'RichTextField', 'cmsAttr': 'mainBody' },
      'promo': {
        '_type': 'Component',
        'map': {
          'description': { '_type': 'TextField', 'cmsAttr': 'promoText' },
          'title': { '_type': 'TextField', 'cmsAttr': 'promoHeading' },
          // 'image': { '_type': 'AssetField', 'cmsAttr': 'promoImage' },
        }
      }
    },
    'contentType': 'BlogPostPage',
    'container': '70f3c6040a3f4011aa2bcc20a66a09b9',
    'categories': ['62f3bda188974d819da62cc0a937617e']
  }
};
