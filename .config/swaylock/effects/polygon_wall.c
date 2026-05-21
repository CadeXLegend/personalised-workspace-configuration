#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define MAX_VERTS 1024

typedef struct {
    int x, y;
    float h;
    float g;
} vertex_t;

typedef struct {
    int v0, v1, v2;
    float nx, ny, nz;
} triangle_t;

static uint32_t hash32(uint32_t x, uint32_t y) {
    uint32_t h = 0x9E3779B9;
    h ^= x * 0x85ebca6b;
    h ^= y * 0xc2b2ae35;
    h = (h ^ (h >> 13)) * 0x9e3779b9;
    return h ^ (h >> 16);
}

static float frand(uint32_t *s) {
    *s = *s * 1103515245 + 12345;
    return (float)((*s >> 16) & 0x7FFF) / 32767.0f;
}

static float luminance(uint32_t pix) {
    return 0.299f * ((pix >> 16) & 0xFF) + 0.587f * ((pix >> 8) & 0xFF) + 0.114f * (pix & 0xFF);
}

static uint32_t sample(uint32_t *src, int width, int height, float x, float y) {
    int ix = (int)x, iy = (int)y;
    float fx = x - ix, fy = y - iy;
    int x0 = ix < 0 ? 0 : (ix >= width ? width-1 : ix);
    int y0 = iy < 0 ? 0 : (iy >= height ? height-1 : iy);
    int x1 = ix+1 < 0 ? 0 : (ix+1 >= width ? width-1 : ix+1);
    int y1 = iy+1 < 0 ? 0 : (iy+1 >= height ? height-1 : iy+1);

    uint32_t p00 = src[y0 * width + x0];
    uint32_t p10 = src[y0 * width + x1];
    uint32_t p01 = src[y1 * width + x0];
    uint32_t p11 = src[y1 * width + x1];

    float r = (1-fx)*(1-fy)*((p00>>16)&0xFF) + fx*(1-fy)*((p10>>16)&0xFF) + (1-fx)*fy*((p01>>16)&0xFF) + fx*fy*((p11>>16)&0xFF);
    float g = (1-fx)*(1-fy)*((p00>>8)&0xFF) + fx*(1-fy)*((p10>>8)&0xFF) + (1-fx)*fy*((p01>>8)&0xFF) + fx*fy*((p11>>8)&0xFF);
    float b = (1-fx)*(1-fy)*(p00&0xFF) + fx*(1-fy)*(p10&0xFF) + (1-fx)*fy*(p01&0xFF) + fx*fy*(p11&0xFF);

    return ((uint32_t)(uint8_t)r << 16) | ((uint32_t)(uint8_t)g << 8) | (uint32_t)(uint8_t)b;
}

void swaylock_effect(uint32_t *data, int width, int height, int scale) {
    float cell_size = 180.0f;
    float pad = cell_size * 6.0f;
    int gcols = (int)((width + pad * 2) / cell_size) + 2;
    int grows = (int)((height + pad * 2) / cell_size) + 2;
    int nverts = gcols * grows;
    if (nverts > MAX_VERTS) nverts = MAX_VERTS;

    vertex_t verts[MAX_VERTS];
    uint32_t seed = 0xDEADCAFE;

    int vi = 0;
    for (int row = 0; row < grows && vi < MAX_VERTS; row++) {
        for (int col = 0; col < gcols && vi < MAX_VERTS; col++) {
            uint32_t hh = hash32(col, row);
            float jx = frand(&hh) * 0.25f - 0.125f;
            float jy = frand(&hh) * 0.25f - 0.125f;
            int sx = (int)(-pad + (col + 0.5f + jx) * cell_size);
            int sy = (int)(-pad + (row + 0.5f + jy) * cell_size);
            if (sx < 0) sx = 0;
            if (sx >= width) sx = width - 1;
            if (sy < 0) sy = 0;
            if (sy >= height) sy = height - 1;

            verts[vi].x = sx;
            verts[vi].y = sy;
            verts[vi].h = 60.0f + frand(&hh) * 80.0f;
            verts[vi].g = 0.95f + frand(&hh) * 0.10f;
            vi++;
        }
    }
    nverts = vi;

    int max_tris = (gcols-1) * (grows-1) * 2;
    triangle_t *tris = malloc(max_tris * sizeof(triangle_t));
    if (!tris) return;
    int ntri = 0;

    for (int row = 0; row < grows - 1; row++) {
        for (int col = 0; col < gcols - 1; col++) {
            int a = row * gcols + col;
            int b = row * gcols + col + 1;
            int c = (row + 1) * gcols + col;
            int d = (row + 1) * gcols + col + 1;
            if (a >= nverts || b >= nverts || c >= nverts || d >= nverts) continue;

            uint32_t hh = hash32(col, row);
            if (frand(&hh) > 0.5f) {
                if (ntri < max_tris) {
                    tris[ntri].v0 = a; tris[ntri].v1 = b; tris[ntri].v2 = d;
                    float ux = verts[b].x - verts[a].x, uy = verts[b].y - verts[a].y, uz = verts[b].h - verts[a].h;
                    float vx = verts[d].x - verts[a].x, vy = verts[d].y - verts[a].y, vz = verts[d].h - verts[a].h;
                    tris[ntri].nx = uy*vz - uz*vy; tris[ntri].ny = uz*vx - ux*vz; tris[ntri].nz = ux*vy - uy*vx;
                    float nl = sqrtf(tris[ntri].nx*tris[ntri].nx + tris[ntri].ny*tris[ntri].ny + tris[ntri].nz*tris[ntri].nz);
                    if (nl > 0.0001f) { tris[ntri].nx /= nl; tris[ntri].ny /= nl; tris[ntri].nz /= nl; }
                    ntri++;
                }
                if (ntri < max_tris) {
                    tris[ntri].v0 = a; tris[ntri].v1 = c; tris[ntri].v2 = d;
                    float ux = verts[c].x - verts[a].x, uy = verts[c].y - verts[a].y, uz = verts[c].h - verts[a].h;
                    float vx = verts[d].x - verts[a].x, vy = verts[d].y - verts[a].y, vz = verts[d].h - verts[a].h;
                    tris[ntri].nx = uy*vz - uz*vy; tris[ntri].ny = uz*vx - ux*vz; tris[ntri].nz = ux*vy - uy*vx;
                    float nl = sqrtf(tris[ntri].nx*tris[ntri].nx + tris[ntri].ny*tris[ntri].ny + tris[ntri].nz*tris[ntri].nz);
                    if (nl > 0.0001f) { tris[ntri].nx /= nl; tris[ntri].ny /= nl; tris[ntri].nz /= nl; }
                    ntri++;
                }
            } else {
                if (ntri < max_tris) {
                    tris[ntri].v0 = a; tris[ntri].v1 = b; tris[ntri].v2 = c;
                    float ux = verts[b].x - verts[a].x, uy = verts[b].y - verts[a].y, uz = verts[b].h - verts[a].h;
                    float vx = verts[c].x - verts[a].x, vy = verts[c].y - verts[a].y, vz = verts[c].h - verts[a].h;
                    tris[ntri].nx = uy*vz - uz*vy; tris[ntri].ny = uz*vx - ux*vz; tris[ntri].nz = ux*vy - uy*vx;
                    float nl = sqrtf(tris[ntri].nx*tris[ntri].nx + tris[ntri].ny*tris[ntri].ny + tris[ntri].nz*tris[ntri].nz);
                    if (nl > 0.0001f) { tris[ntri].nx /= nl; tris[ntri].ny /= nl; tris[ntri].nz /= nl; }
                    ntri++;
                }
                if (ntri < max_tris) {
                    tris[ntri].v0 = b; tris[ntri].v1 = c; tris[ntri].v2 = d;
                    float ux = verts[c].x - verts[b].x, uy = verts[c].y - verts[b].y, uz = verts[c].h - verts[b].h;
                    float vx = verts[d].x - verts[b].x, vy = verts[d].y - verts[b].y, vz = verts[d].h - verts[b].h;
                    tris[ntri].nx = uy*vz - uz*vy; tris[ntri].ny = uz*vx - ux*vz; tris[ntri].nz = ux*vy - uy*vx;
                    float nl = sqrtf(tris[ntri].nx*tris[ntri].nx + tris[ntri].ny*tris[ntri].ny + tris[ntri].nz*tris[ntri].nz);
                    if (nl > 0.0001f) { tris[ntri].nx /= nl; tris[ntri].ny /= nl; tris[ntri].nz /= nl; }
                    ntri++;
                }
            }
        }
    }

    uint32_t *src = malloc(width * height * sizeof(uint32_t));
    if (!src) { free(tris); return; }
    memcpy(src, data, width * height * sizeof(uint32_t));

    for (int ti = 0; ti < ntri; ti++) {
        vertex_t *v0 = &verts[tris[ti].v0];
        vertex_t *v1 = &verts[tris[ti].v1];
        vertex_t *v2 = &verts[tris[ti].v2];

        int minx = v0->x < v1->x ? (v0->x < v2->x ? v0->x : v2->x) : (v1->x < v2->x ? v1->x : v2->x);
        int maxx = v0->x > v1->x ? (v0->x > v2->x ? v0->x : v2->x) : (v1->x > v2->x ? v1->x : v2->x);
        int miny = v0->y < v1->y ? (v0->y < v2->y ? v0->y : v2->y) : (v1->y < v2->y ? v1->y : v2->y);
        int maxy = v0->y > v1->y ? (v0->y > v2->y ? v0->y : v2->y) : (v1->y > v2->y ? v1->y : v2->y);

        if (minx < 1) minx = 1;
        if (maxx >= width - 1) maxx = width - 2;
        if (miny < 1) miny = 1;
        if (maxy >= height - 1) maxy = height - 2;

        int dx01 = v1->x - v0->x, dy01 = v1->y - v0->y;
        int dx12 = v2->x - v1->x, dy12 = v2->y - v1->y;
        int dx20 = v0->x - v2->x, dy20 = v0->y - v2->y;

        float nz = tris[ti].nz;
        float displace_scale = (1.0f - fabsf(nz)) * 0.6f + 0.08f;

        float area = 0.5f * fabsf((float)(dx01 * (v2->y - v0->y) - dy01 * (v2->x - v0->x)));
        float len01 = sqrtf((float)(dx01*dx01 + dy01*dy01));
        float len12 = sqrtf((float)(dx12*dx12 + dy12*dy12));
        float len20 = sqrtf((float)(dx20*dx20 + dy20*dy20));
        if (len01 < 0.0001f) len01 = 0.0001f;
        if (len12 < 0.0001f) len12 = 0.0001f;
        if (len20 < 0.0001f) len20 = 0.0001f;

        for (int y = miny; y <= maxy; y++) {
            for (int x = minx; x <= maxx; x++) {
                float fe0 = (float)(dx01 * (y - v0->y) - dy01 * (x - v0->x));
                float fe1 = (float)(dx12 * (y - v1->y) - dy12 * (x - v1->x));
                float fe2 = (float)(dx20 * (y - v2->y) - dy20 * (x - v2->x));
                if ((fe0 <= 0.0f && fe1 <= 0.0f && fe2 <= 0.0f) || (fe0 >= 0.0f && fe1 >= 0.0f && fe2 >= 0.0f)) {
                    float d0 = fabsf(fe0) / len01;
                    float d1 = fabsf(fe1) / len12;
                    float d2 = fabsf(fe2) / len20;
                    float min_dist = fminf(fminf(d0, d1), d2);
                    float edge_fade = fminf(1.0f, min_dist / 1.0f);

                    float w0 = fabsf((float)(dx12 * (y - v2->y) - dy12 * (x - v2->x))) / (area * 2.0f);
                    float w1 = fabsf((float)(dx20 * (y - v0->y) - dy20 * (x - v0->x))) / (area * 2.0f);
                    float pixel_h = w0 * v0->h + w1 * v1->h + (1.0f - w0 - w1) * v2->h;

                    float sx = x + tris[ti].nx * pixel_h * displace_scale * 8.0f;
                    float sy = y + tris[ti].ny * pixel_h * displace_scale * 8.0f;

                    if (sx < 1.0f) sx = 1.0f; if (sx >= width - 1.0f) sx = width - 2.0f;
                    if (sy < 1.0f) sy = 1.0f; if (sy >= height - 1.0f) sy = height - 2.0f;

                    float grad = w0 * verts[tris[ti].v0].g + w1 * verts[tris[ti].v1].g + (1.0f - w0 - w1) * verts[tris[ti].v2].g;

                    uint32_t color = sample(src, width, height, sx, sy);
                    uint8_t r = (uint8_t)fminf(255.0f, ((color >> 16) & 0xFF) * grad);
                    uint8_t g = (uint8_t)fminf(255.0f, ((color >> 8) & 0xFF) * grad);
                    uint8_t b = (uint8_t)fminf(255.0f, (color & 0xFF) * grad);

                    if (edge_fade < 1.0f) {
                        uint32_t orig = src[y * width + x];
                        uint8_t o_r = (uint8_t)fminf(255.0f, ((orig >> 16) & 0xFF) * grad);
                        uint8_t o_g = (uint8_t)fminf(255.0f, ((orig >> 8) & 0xFF) * grad);
                        uint8_t o_b = (uint8_t)fminf(255.0f, (orig & 0xFF) * grad);
                        r = (uint8_t)((float)r * edge_fade + (float)o_r * (1.0f - edge_fade));
                        g = (uint8_t)((float)g * edge_fade + (float)o_g * (1.0f - edge_fade));
                        b = (uint8_t)((float)b * edge_fade + (float)o_b * (1.0f - edge_fade));
                    }

                    data[y * width + x] = ((uint32_t)r << 16) | ((uint32_t)g << 8) | (uint32_t)b;
                }
            }
        }
    }

    for (int x = 0; x < width; x++) {
        data[x] = data[width + x];
        data[(height - 1) * width + x] = data[(height - 2) * width + x];
    }
    for (int y = 0; y < height; y++) {
        data[y * width] = data[y * width + 1];
        data[y * width + width - 1] = data[y * width + width - 2];
    }

    free(src);
    free(tris);
}
