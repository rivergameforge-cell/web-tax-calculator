import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'build'))
import tistory_prepare


class TistoryPackageImageTests(unittest.TestCase):
    def test_package_references_existing_image_without_copy(self):
        source = ROOT / 'blog_post' / '주택담보대출_이자_소득공제_한도_계산_티스토리.txt'
        image = ROOT / 'thumbnails' / 'mortgage-interest-income-deduction-tistory.webp'
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / 'package'
            helper = tistory_prepare.write_package(source, output, image)
            self.assertEqual((output / 'image-path.txt').read_text().strip(), str(image.resolve()))
            self.assertIn(image.resolve().as_uri(), helper.read_text())
            self.assertFalse((output / image.name).exists())
            self.assertTrue(image.exists())

    def test_package_without_image_still_produces_upload_files(self):
        source = ROOT / 'blog_post' / '주택담보대출_이자_소득공제_한도_계산_티스토리.txt'
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / 'package'
            helper = tistory_prepare.write_package(source, output, None)
            self.assertEqual((output / 'image-path.txt').read_text().strip(), '')
            self.assertEqual({p.name for p in output.iterdir()}, {'title.txt', 'body.html', 'tags.txt', 'image-path.txt', 'upload-helper.html'})
            self.assertIn('이미지 없음', helper.read_text())


if __name__ == '__main__':
    unittest.main()
