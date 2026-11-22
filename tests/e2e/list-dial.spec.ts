import { expect, test } from '@playwright/test';
import candidates from '../../data/vocabulary.pending.json' with { type: 'json' };

test('刻度轮选择 List 50，切换范围需要重新确认，复习可按 List 筛选', async ({ page }, info) => {
  const words = candidates.words.slice(0, 50).map((word, index) => ({
    ...word,
    list_ids: [index + 1],
    origins: [{ list: index + 1, symbol: word.initial_level === 'unknown' ? '○' : '△', source: 'test', raw: word.word }],
  }));
  await page.goto('/');
  await page.getByRole('button', { name: '导入与备份', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: '50-lists.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...candidates, words })),
  });

  const dial = page.getByRole('slider', { name: '导入范围' });
  await dial.press('Home');
  await dial.press('PageUp');
  await expect(dial).toHaveAttribute('aria-valuetext', 'List 11');
  await page.getByRole('checkbox', { name: '我已核对以上词形' }).check();
  await dial.press('End');
  await expect(dial).toHaveAttribute('aria-valuetext', 'List 50');
  await expect(page.getByRole('button', { name: '下一个 List' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '确认导入 1 词' })).toBeDisabled();

  await dial.scrollIntoViewIfNeeded();
  const track = (await dial.boundingBox())!;
  await page.mouse.move(track.x + track.width / 2, track.y + track.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width / 2 + 2 * track.width / 9, track.y + track.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(dial).toHaveAttribute('aria-valuetext', 'List 48');
  await page.screenshot({ path: info.outputPath('list-dial-desktop.png') });

  await page.getByRole('button', { name: '全部候选', exact: true }).click();
  await expect(page.getByRole('button', { name: '确认导入 50 词' })).toBeDisabled();
  await page.getByRole('checkbox', { name: '我已核对以上词形' }).check();
  await page.getByRole('button', { name: '确认导入 50 词' }).click();
  await expect(page.getByRole('status')).toContainText('已合并 50');
  await page.getByRole('button', { name: '闪卡复习', exact: true }).click();
  await page.getByRole('slider', { name: '学习范围' }).press('End');
  await expect(page.getByText('自由练习可选 1 词')).toBeVisible();
  await page.getByRole('button', { name: '开始复习', exact: true }).click();
  await expect(page.getByRole('heading', { name: words[49].word, exact: true })).toBeVisible();
});

test('320px 手机可滑动和点按刻度轮，单独打开对应 List 核对', async ({ page, context }, info) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/');
  await page.getByRole('button', { name: '导入与备份', exact: true }).tap();
  const dial = page.getByRole('slider', { name: '选择要核对的 List' });
  const latest = Math.max(...candidates.words.flatMap(word => word.list_ids));
  await expect(dial).toHaveAttribute('aria-valuetext', `List ${latest}`);
  await dial.scrollIntoViewIfNeeded();
  const track = (await dial.boundingBox())!;
  const x = Math.round(track.x + track.width / 3);
  const y = Math.round(track.y + track.height / 2);
  const step = track.width / 9;
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + Math.round(step), y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + Math.round(step * 2), y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(dial).toHaveAttribute('aria-valuetext', `List ${latest - 2}`);

  await dial.tap({ position: { x: Math.round(track.width / 2 + step), y: 65 } });
  const selected = latest - 1;
  await expect(dial).toHaveAttribute('aria-valuetext', `List ${selected}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('list-dial-mobile.png') });
  await page.getByRole('button', { name: `核对 List ${selected}`, exact: true }).tap();
  const total = candidates.words.filter(word => word.list_ids.includes(selected)).length;
  await expect(page.getByRole('slider', { name: '导入范围' })).toHaveAttribute('aria-valuetext', `List ${selected}`);
  await expect(page.getByRole('button', { name: `确认导入 ${total} 词` })).toBeDisabled();
});
