"""
Step 9: rebalance the AO curve for the denser mesh.

The hi-fi mesh samples AO at 257,806 vertices instead of 84,802, so vertices
now land inside small crevices the coarse mesh skipped entirely. The AO is more
accurate, but the SAME gamma (1.45) that gave 26.9% deep / 15.7% lit on the
172k mesh gives 50.7% / 12.9% here -- visibly over-darkened versus the approved
look, which is bright ochre walls against dark pores.

Raw AO is recoverable from the stored colour (it was a pure multiply), so the
curve can be re-shaped without re-running the Cycles bake. Picks the gamma that
best restores the approved tonal split.
"""
import bpy
import sys

BLEND = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-hifi.blend"
OUT_GLB = sys.argv[sys.argv.index("--") + 1]

OLD_GAMMA = 1.45
TINT = (0.791, 0.5642, 0.16625)
TARGET_DEEP = 0.27  # approved 172k distribution: 26.9% deep, 15.7% lit

bpy.ops.wm.open_mainfile(filepath=BLEND)
lp = bpy.data.objects["Scaffold_LP_hifi"]
attr = lp.data.color_attributes["final_vc"]
n = len(attr.data)

# recover raw AO
raw = [0.0] * n
for i in range(n):
    v = attr.data[i].color[0] / TINT[0]
    raw[i] = min(1.0, max(0.0, v)) ** (1.0 / OLD_GAMMA)

srt = sorted(raw)
def pct(p):
    return srt[min(n - 1, int(p * n))]
print(f"raw AO percentiles: p10={pct(0.10):.3f} p25={pct(0.25):.3f} "
      f"median={pct(0.50):.3f} p75={pct(0.75):.3f} p90={pct(0.90):.3f}")

def split(g):
    deep = lit = 0
    for v in raw:
        a = v ** g
        if a < 0.25:
            deep += 1
        elif a > 0.7:
            lit += 1
    return deep / n, lit / n

print("gamma   deep(<0.25)  lit(>0.7)")
best, besterr = 1.0, 9.9
for g in (0.70, 0.80, 0.90, 1.00, 1.15, 1.30, 1.45):
    d, l = split(g)
    print(f" {g:.2f}     {d:6.1%}      {l:6.1%}")
    err = abs(d - TARGET_DEEP)
    if err < besterr:
        best, besterr = g, err
print(f"selected gamma = {best:.2f} (closest to {TARGET_DEEP:.0%} deep)")

tr, tg, tb = TINT
for i in range(n):
    a = raw[i] ** best
    attr.data[i].color = (tr * a, tg * a, tb * a, 1.0)

lp.data.attributes.active_color = attr
lp.data.color_attributes.render_color_index = lp.data.color_attributes.find("final_vc")
bpy.ops.wm.save_as_mainfile(filepath=BLEND)

bpy.ops.object.select_all(action="DESELECT")
lp.select_set(True)
bpy.context.view_layer.objects.active = lp
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB, export_format="GLB", use_selection=True, export_apply=True,
    export_yup=True, export_normals=True, export_texcoords=False, export_tangents=False,
    export_materials="PLACEHOLDER", export_vertex_color="ACTIVE",
    export_active_vertex_color_when_no_material=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_color_quantization=10,
)
print("EXPORTED", OUT_GLB)
print("DONE_STEP9")
