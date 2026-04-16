package com.saas.core.storage;

import java.io.InputStream;

public interface ObjectStoragePort {

    String putObject(String bucket, String objectKey, InputStream inputStream, long size, String contentType);
}
