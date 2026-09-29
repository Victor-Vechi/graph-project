-- CreateTable
CREATE TABLE "post_logs" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "postTitle" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "changes" TEXT[],
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_logs_postId_idx" ON "post_logs"("postId");

-- CreateIndex
CREATE INDEX "post_logs_userId_idx" ON "post_logs"("userId");

-- AddForeignKey
ALTER TABLE "post_logs" ADD CONSTRAINT "post_logs_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_logs" ADD CONSTRAINT "post_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
