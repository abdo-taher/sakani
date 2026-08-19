import React from 'react';
import { PageLoader, PageLoaderProps } from './PageLoader';

export interface SakaniBrandedLoaderProps extends PageLoaderProps {}

export const SakaniBrandedLoader: React.FC<SakaniBrandedLoaderProps> = (props) => {
  return <PageLoader {...props} />;
};

export default SakaniBrandedLoader;
