// lib/middleware/withAuthPage.ts
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export function withAuthPage<T>(
    getServerSidePropsFunc: (ctx: GetServerSidePropsContext, user: any) => Promise<GetServerSidePropsResult<T>>
) {
    return async (ctx: GetServerSidePropsContext) => {
        const { req, res } = ctx;
        const supabase = createPagesServerClient({ req, res } as { req: NextApiRequest, res: NextApiResponse });

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                redirect: {
                    destination: "/login",
                    permanent: false,
                },
            };
        }

        return getServerSidePropsFunc(ctx, user);
    };
}
