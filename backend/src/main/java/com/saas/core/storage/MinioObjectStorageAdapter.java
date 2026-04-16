package com.saas.core.storage;

import com.saas.core.exceptions.BusinessException;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
public class MinioObjectStorageAdapter implements ObjectStoragePort {

    private final MinioClient minioClient;

    public MinioObjectStorageAdapter(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    @Override
    public String putObject(String bucket, String objectKey, InputStream inputStream, long size, String contentType) {
        try {
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .stream(inputStream, size, -1)
                            .contentType(contentType)
                            .build()
            );
            return objectKey;
        } catch (Exception e) {
            throw new BusinessException("Could not store object");
        }
    }
}
