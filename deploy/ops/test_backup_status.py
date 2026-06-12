#!/usr/bin/env python3

import gzip
from pathlib import Path
import tempfile
import unittest

from write_backup_status import gzip_valid


class BackupStatusTests(unittest.TestCase):
    def test_detects_valid_and_invalid_gzip_files(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            valid = Path(directory) / "valid.sql.gz"
            invalid = Path(directory) / "invalid.sql.gz"
            with gzip.open(valid, "wb") as stream:
                stream.write(b"CREATE TABLE test (id int);")
            invalid.write_bytes(b"not a gzip archive")

            self.assertTrue(gzip_valid(valid))
            self.assertFalse(gzip_valid(invalid))


if __name__ == "__main__":
    unittest.main()
