/** step0：テストの土台とSupabaseのモック化 */ 

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { App } from "./App";

// 1. テスト用の模擬データベース
let mockRecords = [];

// 2. Supabaseの挙動をモック（偽装）する
vi.mock('./supabase', () => ({
    supabase: {
        from: () => ({
            select: async () => ({
                data: mockRecords,
                error: null,
            }),
            insert: async (newRecord) => {
                mockRecords.push({
                    id: Date.now(),
                    ...newRecord[0],
                });
                return { error: null };
            },
            delete: () => ({
                eq: async (_column, id) => {
                    mockRecords = mockRecords.filter((record) => record.id !== id);
                    return {error: null};
                },
            }),
        }),
    },
}));

describe('Study Record App', () => {
    // 3. 各テストが実行される前に、毎回データを初期化する
    beforeEach(() => {
        mockRecords = [
            {
                id: 1,
                title: 'React',
                time: 2,
            },
        ];
    });

    // ここにテストケースを書き足していく

    test('タイトルが表示されること', async () => {
        render(<App />);

        // 画面内に「学習記録一覧」と「学習内容」と「学習時間」と「登録」が存在するか検証

        // 最初はLoading状態なので、非同期のfindByRoleを使ってh1の出現を待機する
        expect(await screen.findByRole('heading', {name: '学習記録一覧'})).toBeInTheDocument();

        // 上記のfindByRoleで画面の描画完了を待ったので、以降はgetByTextで即座に取得可能
        expect(screen.getByRole('textbox', {name: '学習内容'})).toBeInTheDocument();
        expect(screen.getByRole('textbox', {name: '学習時間'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: '登録'})).toBeInTheDocument();
    });

    test('フォームに学習内容と時間を入力して登録ボタンを押すと新たに記録が追加されている', async () => {
        // ユーザ操作のセットアップ（推奨アクション）
        const user = userEvent.setup();

        render(<App />);
        
        // 初期データが表示されるのを待つ(Loadingの完了)
        await screen.findByText('React：2');

        // 2つの入力フォームを取得
        const titleInput = screen.getByRole('textbox', {name: '学習内容'});
        const timeInput = screen.getByRole('textbox', {name: '学習時間'});

        // ユーザのタイピング操作をシミュレート
        await user.type(titleInput, 'Vitest学習');
        await user.type(timeInput, '3');

        // 登録ボタンをクリック
        await user.click(screen.getByRole('button', {name: '登録'}));

        // 新しい記録が画面に表示されたかを検証
        expect(await screen.findByText('Vitest学習：3')).toBeInTheDocument();

        expect(titleInput).toHaveValue('');
        expect(timeInput).toHaveValue('');
        expect(screen.getByText('合計時間：5 / 1000（h）')).toBeInTheDocument();
    });

    test('削除ボタンを押すと学習記録が削除される', async () => {
        const user = userEvent.setup();
        
        render(<App />);

        // 削除対象の記録があることを確認
        const record = await screen.findByText('React：2');
        expect(record).toBeInTheDocument();

        // 削除ボタンをクリック
        const deleteButton = screen.getByRole('button', {name: '削除'});
        await user.click(deleteButton);

        // 画面から「React：2」が消えるまで待機して検証
        await waitFor(() => {
            expect(screen.queryByText('React：2')).not.toBeInTheDocument();
        });

        expect(screen.getByText('合計時間：0 / 1000（h）')).toBeInTheDocument();
    });

    test('入力をしないで登録を押すとエラーが表示される', async () => {
        const user = userEvent.setup();

        render(<App />);

        await screen.findByText('React：2');

        // 何もせずに登録ボタンをクリック
        await user.click(screen.getByRole('button', {name: '登録'}));

        // エラーメッセージが表示されるか検証
        expect(await screen.findByRole('alert')).toHaveTextContent('入力されていない項目があります');
        // 画面上のリストの数が増えていないことも検証
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(1);
    });
});
