FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf update -y && \
    dnf install -y nodejs npm && \
    dnf clean all

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci || npm install
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "run", "start"]