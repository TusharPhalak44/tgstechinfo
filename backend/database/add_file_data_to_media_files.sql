-- Store uploaded content bytes so media remains available after upload files are removed.
ALTER TABLE media_files
    ADD COLUMN IF NOT EXISTS file_data LONGBLOB NULL;